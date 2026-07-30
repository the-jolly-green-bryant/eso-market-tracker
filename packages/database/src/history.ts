import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pLimit from "p-limit";
import { Item } from "@eso-market-tracker/eso";
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

const readHistory = async (filePath: string): Promise<ObservationStats[]> => {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as
      ObservationStats[] | Record<string, ObservationStats>;
    return Array.isArray(parsed) ? parsed : Object.values(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
};

const writeAtomic = async (filePath: string, content: string) => {
  try {
    if ((await fs.readFile(filePath, "utf8")) === content) return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, content);
    await fs.rename(temporaryPath, filePath);
    return true;
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
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
  const changed = (
    await Promise.all(
      projections.map(({ relativePath, additions }) =>
        limit(async () => {
          const historicalPath = path.join(repositoryRoot, relativePath);
          const previous = await readHistory(historicalPath);
          const candidates = options?.preserveExisting
            ? additions.concat(previous)
            : previous.concat(additions);
          const byDate = new Map(
            candidates
              .filter(({ maximum }) => maximum > 0)
              .map((stats) => [stats.date, stats]),
          );
          const merged = [...byDate.values()].sort((left, right) =>
            left.date.localeCompare(right.date),
          );
          const historicalChanged = await writeAtomic(
            historicalPath,
            JSON.stringify({ ...merged }),
          );
          const currentChanged = await writeAtomic(
            historicalPath.replace(".historical.json", ".current.json"),
            JSON.stringify(merged.at(-1)),
          );
          return historicalChanged || currentChanged ? relativePath : undefined;
        }),
      ),
    )
  ).filter((value): value is string => Boolean(value));

  return changed;
};
