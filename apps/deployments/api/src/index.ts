import { getShardedRecord } from "@eso-market-tracker/eso-addon";
import { execFileSync } from "node:child_process";
import { logger, orThrow } from "@eso-market-tracker/logging";
import * as fs from "node:fs";
import path from "node:path";
import * as os from "node:os";
import { db, MASTER_ITEM_INDEX } from "@eso-market-tracker/data";

const __chunk = <T>(items: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

const _getItemMeta = (internalId: number) => {
  const stmt = db().prepare(`
    SELECT *
    FROM items
    WHERE internalId = ?
  `);

  return (
    stmt.get(internalId) ||
    orThrow(new Error(`Item not found for ID ${internalId}`))
  );
};

const _updateSearchIndex = async (internalIds: number[]) => {
  const searchIndex = Object.entries(await MASTER_ITEM_INDEX())
    .map(([name, data]) => ({
      name,
      internalId: data.internalId,
      icon: data.icon,
      description: data.description,
      normalizedName: name
        .toLowerCase()
        .trim()
        .replace(/[,:".()/']/g, "")
        .replace(/\s+/gu, " "),
    }))
    .filter((i) => internalIds.includes(i.internalId));

  const filePath = path.join(os.tmpdir(), `kv-search.json`);
  await fs.promises.writeFile(
    filePath,
    JSON.stringify([
      { key: "SEARCH_INDEX", value: JSON.stringify(searchIndex) },
    ]),
  );

  const args = [
    "wrangler",
    "kv",
    "bulk",
    "put",
    filePath,
    "--namespace-id=c1b66d8fb78d4881ab064e462bd5d5f6",
    "--remote",
  ];

  logger.info(args.join(" "));
  execFileSync("npx", args, { stdio: "inherit" });
};

export const updateKeyValues = async (options?: {
  maxKeys?: number;
  internalIds?: number[];
  updateSearchIndex?: boolean;
}) => {
  const selectedIds = options?.internalIds?.length
    ? new Set(options.internalIds)
    : null;
  const record = (await getShardedRecord()) as Record<
    string,
    Record<string, unknown>
  >;
  const flattened = Object.values(record)
    .flatMap(Object.values)
    .flatMap(Object.entries)
    .filter(([key]) => !selectedIds || selectedIds.has(Number.parseInt(key)))
    .map(([key, data]) => [
      key,
      {
        pricing: data,
        item: _getItemMeta(Number.parseInt(key)),
      },
    ]);

  const raw = flattened.map(([key, data]) => ({
    key,
    value: JSON.stringify(data),
  }));

  const batches = __chunk(
    raw.slice(0, options?.maxKeys || flattened.length) as Record<
      string,
      string
    >[],
    10_000,
  );

  for (const [index, batch] of batches.entries()) {
    const filePath = path.join(os.tmpdir(), `kv-${index}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(batch));

    const args = [
      "wrangler",
      "kv",
      "bulk",
      "put",
      filePath,
      "--namespace-id=c1b66d8fb78d4881ab064e462bd5d5f6",
      "--remote",
    ];

    logger.info(args.join(" "));
    execFileSync("npx", args, { stdio: "inherit" });
  }

  if (!selectedIds || options?.updateSearchIndex) {
    await _updateSearchIndex(raw.map((i) => Number.parseInt(i.key as string)));
  }
};
