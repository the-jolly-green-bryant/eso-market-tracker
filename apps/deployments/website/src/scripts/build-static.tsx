import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { CATEGORIES } from "../constants";
import { fileURLToPath } from "node:url";
import {
  _responseToItem,
  APIItemResponse,
  getIdFromName,
} from "../pages/useItem";
import { TradableItemType } from "../models/tradable-item-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../..", "dist");
const BUILD_TIME = new Date().toISOString();
const ITEM_RENDER_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.ESO_STATIC_RENDER_CONCURRENCY || "8"),
);

type SitemapEntry = {
  url: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: number;
};

const sitemap = new Map<string, SitemapEntry>();

const applyRenderedPage = (
  template: string,
  rendered: { html: string; head: string },
) => {
  const withoutGenericSeo = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(
      /\s*<meta\s+(?:name|property)="(?:description|og:title|og:description|og:url|og:type|twitter:card)"[^>]*\/?>/g,
      "",
    )
    .replace(/\s*<link\s+rel="canonical"[^>]*\/?>/g, "");

  return withoutGenericSeo
    .replace(
      '<div id="root"></div>',
      `<div id="root">${rendered.html}</div>`,
    )
    .replace("</head>", `${rendered.head}\n</head>`);
};

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
let _PRICING_KEYS_BY_ITEM: Map<number, string[]>;
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

const PRICING_KEYS_BY_ITEM = async () => {
  if (_PRICING_KEYS_BY_ITEM) return _PRICING_KEYS_BY_ITEM;

  _PRICING_KEYS_BY_ITEM = new Map();
  for (const qualifiedId of Object.keys(await MASTER_PRICING_INDEX())) {
    const internalId = Number.parseInt(qualifiedId);
    const keys = _PRICING_KEYS_BY_ITEM.get(internalId) || [];
    keys.push(qualifiedId);
    _PRICING_KEYS_BY_ITEM.set(internalId, keys);
  }

  return _PRICING_KEYS_BY_ITEM;
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
  const keysByItem = await PRICING_KEYS_BY_ITEM();
  return (keysByItem.get(internalId) || [])
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

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderItemSeoPage = (item: TradableItemType) => {
  const itemName = item.displayLabel;
  const price = Math.round(item.currentXboxStats.averageUnitPrice);
  const canonicalUrl = BASE_URL + encodeURI(`/item/${itemName}`);
  const title = `${itemName} Price Check & Market Value | ESO Market Tracker`;
  const description = `Check the current ${itemName} price in ESO. Average console sale price: ${price.toLocaleString()} gold, with recent range and sales history.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${itemName} ESO Price Check`,
        url: canonicalUrl,
        description,
        about: {
          "@type": "Thing",
          name: itemName,
          description: item.description,
        },
        isPartOf: {
          "@type": "WebSite",
          name: "ESO Market Tracker",
          url: `${BASE_URL}/`,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ESO Price Checker",
            item: `${BASE_URL}/dashboard/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: itemName,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return {
    head: `<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>`,
    html: `<main class="seo-static-item">
  <h1>${escapeHtml(itemName)} ESO price check</h1>
  <p>Current average console market value: <strong>${price.toLocaleString()} gold</strong>.</p>
  <p>Compare recent Elder Scrolls Online sale prices and market history for ${escapeHtml(itemName)} on Xbox and PlayStation.</p>
  ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
</main>`,
  };
};

const makeItemPages = async (
  data: TradableItemType[],
  template: string,
) => {
  for (const item of data) {
    const rendered = renderItemSeoPage(item);
    const html = applyRenderedPage(template, rendered);

    const outFile = path.join(distPath, "item", item.displayLabel, "index.html");
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, html);

    const url = encodeURI(`/item/${item.displayLabel}`);
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

const createStaticServer = () =>
  createServer({
    server: { middlewareMode: true },
    appType: "custom",
    ssr: {
      noExternal: [
        "@ionic/core",
        "@ionic/react",
        "@ionic/react-router",
        "ionicons",
      ],
    },
  });

// The build intentionally owns every static route and sitemap entry.
// eslint-disable-next-line max-lines-per-function
const main = async () => {
  const changedIds = new Set(
    (process.env.ESO_CHANGED_ITEM_IDS || "")
      .split(",")
      .filter(Boolean)
      .map(Number),
  );
  const incremental = changedIds.size > 0;
  const vite = await createStaticServer();

  const template = await fs.readFile(
    path.join(distPath, "index.html"),
    "utf-8",
  );
  const { render } = await vite.ssrLoadModule("/src/scripts/build-entry.tsx");

  if (!incremental) {
    for (const staticPage of [
      {
        path: "/dashboard/",
        priority: 1,
        changefreq: "daily" as const,
      },
      {
        path: "/tamriel-savings-price-checker",
        priority: 0.8,
        changefreq: "monthly" as const,
      },
    ]) {
      const rendered = render(staticPage.path, undefined);
      const html = applyRenderedPage(template, rendered);
      const outFile = path.join(distPath, staticPage.path, "index.html");
      await fs.mkdir(path.dirname(outFile), { recursive: true });
      await fs.writeFile(outFile, html);
      if (staticPage.path === "/dashboard/") {
        await fs.writeFile(path.join(distPath, "index.html"), html);
      }
      sitemap.set(staticPage.path, {
        url: staticPage.path,
        lastmod: BUILD_TIME,
        changefreq: staticPage.changefreq,
        priority: staticPage.priority,
      });
    }
  }

  for (const slug of incremental
    ? []
    : (Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[])) {
    console.log("building", slug);

    const data = {
      slug,
      data: await Promise.all(CATEGORIES[slug].map(_itemFromName)),
    };

    const rendered = render(`/category/${slug}`, data);
    const html = applyRenderedPage(template, rendered);

    const outFile = path.join(distPath, "category", slug, "index.html");
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, html);

    const url = encodeURI(`/category/${slug}`);
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
  const itemQueue = [...items];
  const renderNextItem = async () => {
    while (itemQueue.length) {
      const [name] = itemQueue.pop()!;
      const item = (await _itemFromName(name).catch((e: Error) => {
        if (e.message.includes("no pricing")) return null;
        console.error(`${name}: ${e.message}`);
        throw e;
      })) as TradableItemType | null;

      if (item) await makeItemPages([item], template);
    }
  };

  await Promise.all(
    Array.from(
      {
        length: Math.min(ITEM_RENDER_CONCURRENCY, itemQueue.length || 1),
      },
      renderNextItem,
    ),
  );

  await vite.close();
  if (!incremental) {
    await writeSitemap();
  }
};

await main();
