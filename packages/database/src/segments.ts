import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync, gunzipSync, strFromU8, strToU8 } from "fflate";
import { getShardFromId } from "./naming";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultRepositoryRoot = path.resolve(__dirname, "../../..");

/** Aggregate market statistics captured at a point in time. */
export type ObservationStats = {
  average: number;
  date: string;
  commonQuantity: number;
  minimum: number;
  maximum: number;
};

/** Canonical identity and statistics stored as one JSONL record. */
export type ObservationSegmentRecord = {
  itemId: number;
  traitId: number | null;
  qualityId: number | null;
  server: string;
  stats: ObservationStats;
};

type SegmentManifestEntry = {
  records: number;
  sha256: string;
  firstDate: string;
  lastDate: string;
  compressedBytes: number;
  uncompressedBytes: number;
};

type ObservationManifest = {
  schemaVersion: 1 | 2;
  segments: Record<string, SegmentManifestEntry>;
};

const recordKey = (record: ObservationSegmentRecord) =>
  [
    record.itemId,
    record.traitId ?? "",
    record.qualityId ?? "",
    record.server,
    record.stats.date,
  ].join(":");

const assertDate = (date: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12) {
    throw new Error(`Observation date must use YYYY-MM-DD: ${date}`);
  }
  return { year: match[1], month: match[2] };
};

export const getObservationSegmentPath = (record: ObservationSegmentRecord) => {
  const { year, month } = assertDate(record.stats.date);
  const shard = getShardFromId(record.itemId).split("/")[0];
  return `data/segments/observations/${record.server}/${year}/${month}/${shard}.jsonl.gz`;
};

const readJsonLines = async (
  filePath: string,
): Promise<ObservationSegmentRecord[]> => {
  let sourcePath = filePath;
  try {
    let compressed: Buffer;
    try {
      compressed = await fs.readFile(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      sourcePath = filePath.replace(/\.gz$/, "");
      compressed = await fs.readFile(sourcePath);
    }
    const content =
      filePath === sourcePath
        ? strFromU8(gunzipSync(compressed))
        : compressed.toString("utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map((line, index) => {
        try {
          return JSON.parse(line) as ObservationSegmentRecord;
        } catch (error) {
          throw new SyntaxError(
            `Invalid JSONL in ${sourcePath} at line ${index + 1}`,
            { cause: error },
          );
        }
      });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const writeAtomic = async (filePath: string, content: Uint8Array | string) => {
  try {
    const previous = await fs.readFile(filePath);
    const next = typeof content === "string" ? Buffer.from(content) : content;
    if (previous.equals(next)) {
      return false;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
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

const readManifest = async (
  repositoryRoot: string,
): Promise<ObservationManifest> => {
  const manifestPath = path.join(
    repositoryRoot,
    "data/manifests/observations.json",
  );
  try {
    return JSON.parse(
      await fs.readFile(manifestPath, "utf8"),
    ) as ObservationManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { schemaVersion: 2, segments: {} };
    }
    throw error;
  }
};

export const writeObservationSegments = async (
  records: ObservationSegmentRecord[],
  options?: { repositoryRoot?: string; preserveExisting?: boolean },
) => {
  if (records.length === 0) return [];

  const repositoryRoot = options?.repositoryRoot ?? defaultRepositoryRoot;
  const grouped = new Map<string, ObservationSegmentRecord[]>();
  for (const record of records) {
    const segmentPath = getObservationSegmentPath(record);
    const group = grouped.get(segmentPath);
    if (group) group.push(record);
    else grouped.set(segmentPath, [record]);
  }
  const manifest = await readManifest(repositoryRoot);
  const changedSegments: string[] = [];

  for (const [relativePath, additions] of grouped) {
    const filePath = path.join(repositoryRoot, relativePath);
    const previous = await readJsonLines(filePath);
    const candidates = options?.preserveExisting
      ? additions.concat(previous)
      : previous.concat(additions);
    const unique = new Map(
      candidates.map((record) => [recordKey(record), record]),
    );
    const merged = [...unique.values()].sort((left, right) =>
      recordKey(left).localeCompare(recordKey(right)),
    );
    const jsonLines = `${merged.map((record) => JSON.stringify(record)).join("\n")}\n`;
    const content = gzipSync(strToU8(jsonLines), { level: 9, mtime: 0 });
    if (await writeAtomic(filePath, content)) {
      changedSegments.push(relativePath);
    }
    await fs.rm(filePath.replace(/\.gz$/, ""), { force: true });

    const dates = merged
      .map((record) => record.stats.date)
      .sort((left, right) => left.localeCompare(right));
    delete manifest.segments[relativePath.replace(/\.gz$/, "")];
    manifest.segments[relativePath] = {
      records: merged.length,
      sha256: createHash("sha256").update(content).digest("hex"),
      firstDate: dates[0],
      lastDate: dates.at(-1)!,
      compressedBytes: content.byteLength,
      uncompressedBytes: Buffer.byteLength(jsonLines),
    };
  }

  const orderedManifest: ObservationManifest = {
    schemaVersion: 2,
    segments: Object.fromEntries(
      Object.entries(manifest.segments).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  };
  await writeAtomic(
    path.join(repositoryRoot, "data/manifests/observations.json"),
    `${JSON.stringify(orderedManifest, null, 2)}\n`,
  );
  return changedSegments;
};
