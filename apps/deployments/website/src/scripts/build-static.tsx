import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { CATEGORIES } from "../constants";
import { fileURLToPath } from "node:url";
import {
  _responseToHistory,
  _responseToItem,
  APIItemResponse,
  getIdFromName,
} from "../pages/useItem";
import { TradableItemType } from "../models/tradable-item-types";
import fg from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../..", "dist");
const BUILD_TIME = new Date().toISOString();

type SitemapEntry = {
  url: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: number;
};

const sitemap = new Map<string, SitemapEntry>();

const _setNested = (
  root: Record<string, unknown>,
  branchKeys: string[],
  value: unknown,
) => {
  let branch = root;
  for (const key of branchKeys.slice(0, -1)) {
    branch[key] ??= {};
    branch = branch[key] as Record<string, unknown>;
  }
  branch[branchKeys.at(-1)!] = value;
};

let _MASTER_PRICING_INDEX: Record<string, [number, number | null]>;
export const MASTER_PRICING_INDEX = async (): Promise<
  Record<string, [number, number | null]>
> => {
  if (_MASTER_PRICING_INDEX) return _MASTER_PRICING_INDEX;

  const buf = await fs.readFile(
    path.join(__dirname, "../../../../../data", "index", "master-pricing.json"),
  );
  const data = JSON.parse(buf.toString("utf8"));
  _MASTER_PRICING_INDEX = data as Record<string, [number, number | null]>;
  return _MASTER_PRICING_INDEX;
};

type ItemIndexEntry = {
  internalId: number;
};

let _MASTER_ITEM_INDEX: Record<string, ItemIndexEntry>;
export const MASTER_ITEM_INDEX = async (): Promise<
  Record<string, ItemIndexEntry>
> => {
  if (_MASTER_ITEM_INDEX) return _MASTER_ITEM_INDEX;

  const buf = await fs.readFile(
    path.join(__dirname, "../../../../../data", "index", "master-items.json"),
  );
  const data = JSON.parse(buf.toString("utf8"));
  _MASTER_ITEM_INDEX = data as Record<string, ItemIndexEntry>;
  return _MASTER_ITEM_INDEX;
};

// We're going to duplicate this logic into here rather than adding @data as a
//  dependency. The main reason is I just don't want to overcomplicate this
//  deployment by adding internal dependencies. It adds too many moving parts
//  for a project that has low stakes.
export const getShardedRecord = async (name: string) => {
  const internalId = getIdFromName(name);
  const pricingIndex = await MASTER_PRICING_INDEX();
  return Object.keys(pricingIndex)
    .filter((i) => i.startsWith(`${internalId.toString()}-`))
    .reduce((acc, qualifiedId) => {
      const p = /^(.*?)-([-0-9]{2})-([-0-9]{2})\.(.*)$/;
      const [, , traitId, qualityId, platform] = RegExp(p).exec(qualifiedId)!;

      _setNested(
        acc,
        [platform, traitId.replace("-1", "--"), qualityId],
        pricingIndex[qualifiedId],
      );

      return acc;
    }, {});
};

const _getStaticItem = async (name: string) => {
  const internalId = getIdFromName(name);
  console.log(name, internalId);
  const [, sh1, sh2, sh3] = RegExp(/^(\d{2})(\d{2})(\d{2})/).exec(
    internalId.toString().padStart(6, "0").split("").reverse().join(""),
  )!;

  const staticDir = path.join(
    __dirname,
    "../../../../..",
    "data",
    "items",
    sh1,
    sh2,
    sh3,
  );

  return {
    item: JSON.parse(
      await fs.readFile(`${staticDir}/${internalId}.json`, "utf8"),
    ),
    pricing: await getShardedRecord(name),
  } as APIItemResponse;
};

const _itemFromName = async (name: string) =>
  _responseToItem(await _getStaticItem(name));

const __exists = async (p: string) => {
  try {
    await fs.access(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const _fetchHistoricalData = async (name: string) => {
  const internalId = getIdFromName(name);
  const historicalUrl = internalId
    .toString()
    .padStart(6, "0")
    .split("")
    .reverse()
    .join("")
    .substring(0, 6)
    .replace(
      /^(.{2})(.{2})(.{2})/,
      `data/items/$1/$2/$3/${internalId}------.xbox-na.historical.json`,
    );

  const root = path.join(__dirname, "../../../../..");
  const exactPath = path.join(root, historicalUrl);

  if (await __exists(exactPath)) {
    const r = await fs.readFile(exactPath, "utf8");
    return _responseToHistory(JSON.parse(r));
  }

  // fallback
  const matches = await fg(exactPath.replace("------", "-**---"), {
    cwd: root,
    absolute: true,
    onlyFiles: true,
  });

  const fallbackPath = matches
    .sort((a: string, b: string) => a.localeCompare(b))
    .at(0);

  const r2 = await fs.readFile(fallbackPath!, "utf8");
  return _responseToHistory(JSON.parse(r2));
};

const makeItemPages = async (
  data: TradableItemType[],
  render: (arg0: string, arg1: unknown) => string,
  template: string,
) => {
  for (const item of data) {
    console.log("item", JSON.stringify(item));
    const _in = {
      slug: item.displayLabel,
      data: item,
      historicalData: await _fetchHistoricalData(item.displayLabel),
    };

    const inner = render(`/item/${_in.slug}`, _in);
    const html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${inner}</div>`,
    );

    const outFile = path.join(distPath, "item", _in.slug, "index.html");
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, html);

    const url = encodeURI(`/item/${_in.slug}`);
    sitemap.set(url, {
      url,
      lastmod: BUILD_TIME,
      changefreq: "weekly",
      priority: 0.8,
    });
  }
};

const BASE_URL = "https://esomarkettracker.com";

const escapeXml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const buildSitemapXml = (
  entries: SitemapEntry[],
) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    ({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(`${BASE_URL}${url}`)}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ""}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ""}
    ${priority != null ? `<priority>${priority.toFixed(1)}</priority>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const writeSitemap = async () => {
  const entries = [...sitemap.values()].sort((a, b) =>
    a.url.localeCompare(b.url),
  );

  const outFile = path.join(distPath, "sitemap.xml");
  await fs.writeFile(outFile, buildSitemapXml(entries), "utf8");
};

const main = async () => {
  const changedIds = new Set(
    (process.env.ESO_CHANGED_ITEM_IDS || "")
      .split(",")
      .filter(Boolean)
      .map(Number),
  );
  const incremental = changedIds.size > 0;
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  const template = await fs.readFile(
    path.join(distPath, "index.html"),
    "utf-8",
  );
  const { render } = await vite.ssrLoadModule("/src/scripts/build-entry.tsx");

  for (const slug of incremental
    ? []
    : (Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[])) {
    console.log("building", slug);

    const data = {
      slug,
      data: await Promise.all(CATEGORIES[slug].map(_itemFromName)),
    };

    const inner = render(`/category/${slug}`, data);
    const html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${inner}</div>`,
    );

    const outFile = path.join(distPath, "category", slug, "index.html");
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, html);

    const url = encodeURI(`/categories/${slug}`);
    sitemap.set(url, {
      url,
      lastmod: BUILD_TIME,
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  const validIds = new Set(
    Object.keys(await MASTER_PRICING_INDEX()).map((i) =>
      Number.parseInt(i.split("-").at(0)!),
    ),
  );
  const items = Object.entries(await MASTER_ITEM_INDEX()).filter(
    ([, item]) =>
      validIds.has(item.internalId) &&
      (!incremental || changedIds.has(item.internalId)),
  );
  for (const [name] of items) {
    const k = (await _itemFromName(name).catch((e: Error) => {
      console.error(e);
      if (e.message.includes("no pricing")) return null;
      throw e;
    })) as TradableItemType;

    k && (await makeItemPages([k], render, template));
  }

  await vite.close();
  if (!incremental) {
    await writeSitemap();
  }
};

await main();
