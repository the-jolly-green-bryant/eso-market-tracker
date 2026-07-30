import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import type { Zippable } from "fflate";
import { getShardFromId } from "./naming";
import type { ObservationStats } from "./segments";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRepositoryRoot = path.resolve(__dirname, "../../..");
const fixedZipTimestamp = new Date(1980, 0, 1);

/** All variant and platform histories stored in one item's ZIP archive. */
export type ItemPricingArchive = Record<string, ObservationStats[]>;

export const getItemPricingArchivePath = (itemId: number | string) =>
  `data/items/${getShardFromId(itemId)}/${itemId}.pricing.zip`;

export const normalizeHistory = (
  history:
    ObservationStats[] | Record<string, ObservationStats> | null | undefined,
) => (Array.isArray(history) ? history : Object.values(history ?? {}));

export const readItemPricingArchive = async (
  itemId: number | string,
  options?: { repositoryRoot?: string },
): Promise<ItemPricingArchive> => {
  const repositoryRoot = options?.repositoryRoot ?? defaultRepositoryRoot;
  const archivePath = path.join(
    repositoryRoot,
    getItemPricingArchivePath(itemId),
  );

  try {
    const entries = unzipSync(await fs.readFile(archivePath));
    return Object.fromEntries(
      Object.entries(entries)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([entryName, content]) => [
          entryName,
          normalizeHistory(
            JSON.parse(strFromU8(content)) as
              ObservationStats[] | Record<string, ObservationStats>,
          ),
        ]),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
};

export const writeItemPricingArchive = async (
  itemId: number | string,
  histories: ItemPricingArchive,
  options?: { repositoryRoot?: string },
) => {
  const repositoryRoot = options?.repositoryRoot ?? defaultRepositoryRoot;
  const archivePath = path.join(
    repositoryRoot,
    getItemPricingArchivePath(itemId),
  );
  const entries: Zippable = Object.fromEntries(
    Object.entries(histories)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([entryName, history]) => [
        entryName,
        [
          strToU8(JSON.stringify(normalizeHistory(history))),
          { level: 9, mtime: fixedZipTimestamp },
        ],
      ]),
  );
  const content = zipSync(entries, {
    level: 9,
    mtime: fixedZipTimestamp,
  });

  try {
    const previous = await fs.readFile(archivePath);
    if (previous.equals(content)) return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  await fs.mkdir(path.dirname(archivePath), { recursive: true });
  const temporaryPath = `${archivePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, content);
    await fs.rename(temporaryPath, archivePath);
    return true;
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
};
