import {
  getTraitStringFromId,
  Item,
  ItemMeta,
  TRAITS,
} from "@eso-market-tracker/eso";

export * from "./build";
import { db } from "./build";
import { getIdFromName, logger, orThrow } from "@eso-market-tracker/logging";
import * as database from "@eso-market-tracker/database";
import * as cheerio from "cheerio";
import fs from "fs";
import { __fetchWithRetry } from "./fetch";
import { marketDataPath } from "./paths";

let _TRAIT_INDEX: Record<number, [number, number | null]>;
export const TRAIT_INDEX = async (): Promise<
  Record<number, [number, number | null]>
> => {
  if (_TRAIT_INDEX) return _TRAIT_INDEX;

  const buf = await fs.promises.readFile(
    marketDataPath("index", "traits.json"),
  );
  const data = JSON.parse(buf.toString("utf8"));
  _TRAIT_INDEX = data as Record<number, [number, number | null]>;
  return _TRAIT_INDEX;
};

let _MASTER_PRICING_INDEX: Record<string, [number, number | null]>;
export const MASTER_PRICING_INDEX = async (): Promise<
  Record<string, [number, number | null]>
> => {
  if (_MASTER_PRICING_INDEX) return _MASTER_PRICING_INDEX;

  const buf = await fs.promises.readFile(
    marketDataPath("index", "master-pricing.json"),
  );
  const data = JSON.parse(buf.toString("utf8"));
  _MASTER_PRICING_INDEX = data as Record<string, [number, number | null]>;
  return _MASTER_PRICING_INDEX;
};

let _MASTER_ITEM_INDEX: Record<string, ItemMeta>;
let _MASTER_ITEMS_BY_ID: Map<number, ItemMeta>;
export const MASTER_ITEM_INDEX = async (): Promise<
  Record<string, ItemMeta>
> => {
  if (_MASTER_ITEM_INDEX) return _MASTER_ITEM_INDEX;

  const buf = await fs.promises.readFile(
    marketDataPath("index", "master-items.json"),
  );
  const data = JSON.parse(buf.toString("utf8"));
  _MASTER_ITEM_INDEX = data as Record<string, ItemMeta>;
  return _MASTER_ITEM_INDEX;
};

const masterItemsById = async () => {
  if (_MASTER_ITEMS_BY_ID) return _MASTER_ITEMS_BY_ID;
  _MASTER_ITEMS_BY_ID = new Map(
    Object.values(await MASTER_ITEM_INDEX()).map((item) => [
      item.internalId,
      item,
    ]),
  );
  return _MASTER_ITEMS_BY_ID;
};

export const findItemByName = (name: string) => {
  const normalized = getIdFromName(name);
  const stmt = db().prepare(`
    SELECT *
    FROM items
    WHERE internalId = ?
    LIMIT 1
  `);

  console.log(`${name} => ${normalized}`);
  return stmt.get(normalized) as unknown as ItemMeta | null;
};

export const findItemByGameId = async (
  id: number,
): Promise<ItemMeta | null> => {
  const internalId = (await TRAIT_INDEX())[id]?.[0];
  const local = internalId ? (await masterItemsById()).get(internalId) : null;

  if (local) {
    return local;
  }

  const [item, _] = await lookupIdInUESP(id);
  return item;
};

export const _queryUESP = async (
  endpoint: string,
  options?: {
    cookie: string;
  },
): Promise<string> => {
  const cookie =
    options?.cookie ||
    process.env.UESP_COOKIE ||
    orThrow(new Error("No UESP_COOKIE env defined"));

  logger.info(`Endpoint: ${endpoint}`);
  const res = await __fetchWithRetry(endpoint, {
    method: "GET",
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
      cookie,
      referer: "https://esolog.uesp.net/viewlog.php",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "sec-ch-ua": '"Chromium";v="147", "Not.A/Brand";v="8"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
    },
    retries: 4,
    baseDelayMs: 1500,
    logger,
  });

  const _ =
    res.ok || orThrow(new Error(`Failed: ${res.status} ${res.statusText}`));
  return await res.text();
};

export const lookupIdInUESP = async (
  id: number,
): Promise<[ItemMeta, string | null]> => {
  const jsonResponse = await __fetchWithRetry(
    `https://esolog.uesp.net/exportJson.php?table=minedItemSummary&id=${id}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent": "Mozilla/5.0",
      },
      retries: 4,
      baseDelayMs: 1500,
      logger,
    },
  );
  if (jsonResponse.ok) {
    const json = (await jsonResponse.json()) as {
      minedItemSummary?: {
        name: string;
        trait: string;
      }[];
    };
    const summary = json.minedItemSummary?.at(0);
    if (summary) {
      const internalId = getIdFromName(summary.name);
      const item = (await masterItemsById()).get(internalId);
      if (!item) {
        logger.warn(`UESP item ${id} is not in the local item index`);
        return [null!, null];
      }

      await addKnownIdToItem(item, id);
      return [
        item,
        getTraitStringFromId(Number.parseInt(summary.trait)) ?? null,
      ];
    }
  }

  if (!process.env.UESP_COOKIE) {
    return [null!, null];
  }

  let r;
  try {
    r = await _queryUESP(
      `https://esolog.uesp.net/viewlog.php?action=view&record=item&id=${id}`,
    );
  } catch (e) {
    if (process.env.CI) {
      return [null!, null];
    }

    throw e;
  }

  if (r.includes("Failed to retrieve record from database")) {
    return [null!, null];
  }

  const $ = cheerio.load(r);
  const itemName = $('th:contains("name")').next("td").text().trim();
  const item =
    findItemByName(itemName) ||
    orThrow(new Error(`Couldn't find item with id ${id}`));

  const description = $('th:contains("trait")').next("td").text().trim();
  const traitRegEx = new RegExp(` (${TRAITS.join("|")})$`);
  const trait = traitRegEx.exec(description.toLowerCase())?.[1] ?? null;

  // Cache the known ID on the item so the remote lookup is not repeated.
  await addKnownIdToItem(item, id);
  return [item, trait];
};

const addKnownIdToItem = async (item: ItemMeta, id: number) => {
  const targetPath = database.naming.getItemPath(Item.from(item));
  const oldData = (await database.db.readFromFile(
    targetPath,
  )) as ItemMeta | null;
  if (!oldData) {
    throw new Error(
      `Didn't find old data when there should be! ${JSON.stringify(item)} at ${targetPath}`,
    );
  }

  await database.db.writeToFile(
    {
      ...oldData,
      knownIds: [...new Set(oldData.knownIds.concat(id))],
    },
    targetPath,
  );
};
