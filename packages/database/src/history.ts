import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import { Item } from "@eso-market-tracker/eso";
import {
  getItemPricingArchivePath,
  normalizeHistory,
  readItemPricingArchive,
  writeItemPricingArchive,
} from "./archives";
import { getItemDirectory, getQualifiedItem } from "./naming";
import type { ObservationStats } from "./segments";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRepositoryRoot = path.resolve(__dirname, "../../..");

/** One normalized observation to merge into an item history. */
export type ItemHistoryRecord = {
  item: Item;
  server: string;
  stats: ObservationStats;
};

/** A pre-grouped batch of observations targeting one item history file. */
export type ItemHistoryProjection = {
  relativePath: string;
  additions: ObservationStats[];
};

export const getItemHistoryPath = ({
  item,
  server,
}: Pick<ItemHistoryRecord, "item" | "server">) =>
  `${getItemDirectory(item)}/${getQualifiedItem(item)}.${server}.historical.json`;

const readLegacyHistory = async (
  filePath: string,
): Promise<ObservationStats[]> => {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as
      ObservationStats[] | Record<string, ObservationStats>;
    return normalizeHistory(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
};

const getProjectionTarget = (relativePath: string) => {
  const entryName = path.basename(relativePath);
  const itemId = /^(\d+)/.exec(entryName)?.[1];
  if (!itemId || !entryName.endsWith(".historical.json")) {
    throw new Error(`Invalid item history projection path: ${relativePath}`);
  }
  return { itemId, entryName };
};

/**
 * Merges observations directly into the compact per-item projections used by
 * the website. This avoids creating and then deleting one temporary file per
 * item, platform, variant, and release during large historical backfills.
 */
export const writeItemHistories = async (
  records: ItemHistoryRecord[],
  options?: {
    repositoryRoot?: string;
    concurrency?: number;
    preserveExisting?: boolean;
  },
) => {
  if (records.length === 0) return [];

  const grouped = new Map<string, ItemHistoryRecord[]>();
  for (const record of records) {
    const targetPath = getItemHistoryPath(record);
    const group = grouped.get(targetPath);
    if (group) group.push(record);
    else grouped.set(targetPath, [record]);
  }

  return writeItemHistoryProjections(
    [...grouped.entries()].map(([relativePath, additions]) => ({
      relativePath,
      additions: additions.map(({ stats }) => stats),
    })),
    options,
  );
};

export const writeItemHistoryProjections = async (
  projections: ItemHistoryProjection[],
  options?: {
    repositoryRoot?: string;
    concurrency?: number;
    preserveExisting?: boolean;
  },
) => {
  if (projections.length === 0) return [];

  const repositoryRoot = options?.repositoryRoot ?? defaultRepositoryRoot;
  const limit = pLimit(options?.concurrency ?? 32);
  const grouped = new Map<string, ItemHistoryProjection[]>();
  for (const projection of projections) {
    const { itemId } = getProjectionTarget(projection.relativePath);
    const group = grouped.get(itemId);
    if (group) group.push(projection);
    else grouped.set(itemId, [projection]);
  }

  const changed = (
    await Promise.all(
      [...grouped.entries()].map(([itemId, itemProjections]) =>
        limit(async () => {
          const archive = await readItemPricingArchive(itemId, {
            repositoryRoot,
          });

          for (const { relativePath, additions } of itemProjections) {
            const { entryName } = getProjectionTarget(relativePath);
            const legacyPath = path.join(repositoryRoot, relativePath);
            const previous =
              archive[entryName] ?? (await readLegacyHistory(legacyPath));
            const candidates = options?.preserveExisting
              ? additions.concat(previous)
              : previous.concat(additions);
            const byDate = new Map(
              candidates
                .filter(({ maximum }) => maximum > 0)
                .map((stats) => [stats.date, stats]),
            );
            archive[entryName] = [...byDate.values()].sort((left, right) =>
              left.date.localeCompare(right.date),
            );
          }

          return (await writeItemPricingArchive(itemId, archive, {
            repositoryRoot,
          }))
            ? getItemPricingArchivePath(itemId)
            : undefined;
        }),
      ),
    )
  ).filter((value): value is string => Boolean(value));

  return changed;
};
