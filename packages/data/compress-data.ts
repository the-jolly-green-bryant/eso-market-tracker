import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { archives } from "@eso-market-tracker/database";
import fg from "fast-glob";
import { gzipSync, gunzipSync, strFromU8 } from "fflate";
import pLimit from "p-limit";
import { repositoryRoot } from "./paths";

const writeAtomic = async (filePath: string, content: Uint8Array | string) => {
  const next = typeof content === "string" ? Buffer.from(content) : content;
  try {
    if ((await fs.readFile(filePath)).equals(next)) return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, next);
    await fs.rename(temporaryPath, filePath);
    return true;
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
};

const readJson = async (relativePath: string) =>
  JSON.parse(
    await fs.readFile(path.join(repositoryRoot, relativePath), "utf8"),
  );

const migrateItemPricing = async () => {
  const looseFiles = await fg("data/items/**/*.{historical,current}.json", {
    cwd: repositoryRoot,
    onlyFiles: true,
  });
  const filesByItem = new Map<string, string[]>();
  for (const relativePath of looseFiles) {
    const itemId = /^(\d+)/.exec(path.basename(relativePath))?.[1];
    if (!itemId) {
      throw new Error(`Cannot determine item ID for ${relativePath}`);
    }
    const group = filesByItem.get(itemId);
    if (group) group.push(relativePath);
    else filesByItem.set(itemId, [relativePath]);
  }

  let archivedEntries = 0;
  let removedFiles = 0;
  const limit = pLimit(24);
  await Promise.all(
    [...filesByItem.entries()].map(([itemId, relativePaths]) =>
      limit(async () => {
        const pricingArchive = await archives.readItemPricingArchive(itemId, {
          repositoryRoot,
        });
        const historicalPaths = relativePaths.filter((relativePath) =>
          relativePath.endsWith(".historical.json"),
        );

        for (const relativePath of historicalPaths) {
          const entryName = path.basename(relativePath);
          pricingArchive[entryName] = archives.normalizeHistory(
            await readJson(relativePath),
          );
        }
        for (const relativePath of relativePaths) {
          if (!relativePath.endsWith(".current.json")) continue;
          const entryName = path
            .basename(relativePath)
            .replace(".current.json", ".historical.json");
          if (!pricingArchive[entryName]) {
            pricingArchive[entryName] = [await readJson(relativePath)];
          }
        }

        await archives.writeItemPricingArchive(itemId, pricingArchive, {
          repositoryRoot,
        });
        const verified = await archives.readItemPricingArchive(itemId, {
          repositoryRoot,
        });
        for (const [entryName, history] of Object.entries(pricingArchive)) {
          if (JSON.stringify(verified[entryName]) !== JSON.stringify(history)) {
            throw new Error(
              `Archive verification failed for ${itemId}/${entryName}`,
            );
          }
        }

        await Promise.all(
          relativePaths.map((relativePath) =>
            fs.rm(path.join(repositoryRoot, relativePath)),
          ),
        );
        archivedEntries += Object.keys(pricingArchive).length;
        removedFiles += relativePaths.length;
      }),
    ),
  );

  return {
    archives: filesByItem.size,
    archivedEntries,
    removedFiles,
  };
};

const migrateSegments = async () => {
  const legacySegments = await fg("data/segments/**/*.jsonl", {
    cwd: repositoryRoot,
    onlyFiles: true,
  });
  const limit = pLimit(16);

  await Promise.all(
    legacySegments.map((relativePath) =>
      limit(async () => {
        const sourcePath = path.join(repositoryRoot, relativePath);
        const content = await fs.readFile(sourcePath);
        const compressed = gzipSync(content, { level: 9, mtime: 0 });
        const compressedPath = `${sourcePath}.gz`;
        await writeAtomic(compressedPath, compressed);
        if (
          !Buffer.from(gunzipSync(await fs.readFile(compressedPath))).equals(
            content,
          )
        ) {
          throw new Error(`Gzip verification failed for ${relativePath}`);
        }
        await fs.rm(sourcePath);
      }),
    ),
  );

  const compressedSegments = await fg("data/segments/**/*.jsonl.gz", {
    cwd: repositoryRoot,
    onlyFiles: true,
  });
  const entries = await Promise.all(
    compressedSegments.map((relativePath) =>
      limit(async () => {
        const compressed = await fs.readFile(
          path.join(repositoryRoot, relativePath),
        );
        const jsonLines = strFromU8(gunzipSync(compressed));
        const records = jsonLines
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line) as { stats: { date: string } });
        const dates = records
          .map((record) => record.stats.date)
          .sort((left, right) => left.localeCompare(right));
        return [
          relativePath,
          {
            records: records.length,
            sha256: createHash("sha256").update(compressed).digest("hex"),
            firstDate: dates[0],
            lastDate: dates.at(-1),
            compressedBytes: compressed.byteLength,
            uncompressedBytes: Buffer.byteLength(jsonLines),
          },
        ] as const;
      }),
    ),
  );
  const manifest = {
    schemaVersion: 2,
    segments: Object.fromEntries(
      entries.sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
  await writeAtomic(
    path.join(repositoryRoot, "data/manifests/observations.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  return {
    compressedSegments: compressedSegments.length,
    removedFiles: legacySegments.length,
  };
};

const startedAt = performance.now();
const [pricing, segments] = await Promise.all([
  migrateItemPricing(),
  migrateSegments(),
]);
console.log(
  JSON.stringify(
    {
      pricing,
      segments,
      elapsedSeconds: Number(
        ((performance.now() - startedAt) / 1_000).toFixed(1),
      ),
    },
    null,
    2,
  ),
);
