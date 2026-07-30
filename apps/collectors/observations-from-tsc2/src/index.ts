import "dotenv/config";
import { Results } from "./results";
import { db, naming, segments } from "@eso-market-tracker/database";
import { logger } from "@eso-market-tracker/logging";
import * as self from "./index";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "crypto";

const ADDON_ID = "2a88cc14-8e8c-4b73-9605-2e1d7c764e23";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(__dirname, "../../../..");
const sourceManifestPath = path.join(
  repositoryRoot,
  "data/manifests/tsc-addon.json",
);

/* v8 ignore start -- exercised against the authenticated uploader in integration */
type SourceManifest = {
  schemaVersion: 1;
  addonId: string;
  remoteVersion?: string;
  contentSha256: string;
};

const uploaderPath = () =>
  process.env.ESO_UPLOADER_CLI ||
  path.join(repositoryRoot, "ESOAddOnUploaderCli.dmg");

const findAddon = (value: unknown): Record<string, unknown> | undefined => {
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findAddon(child);
      if (found) return found;
    }
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Object.values(record).some((entry) => entry === ADDON_ID))
      return record;
    for (const child of Object.values(record)) {
      const found = findAddon(child);
      if (found) return found;
    }
  }
};

const versionFromAddon = (addon: Record<string, unknown>) => {
  const fields = [
    "latest_version",
    "latestVersion",
    "version",
    "updated_at",
    "updatedAt",
  ];
  const version = fields
    .map((field) => addon[field])
    .find((value) => typeof value === "string" || typeof value === "number");
  return version === undefined ? undefined : String(version);
};

export const getRemoteAddonVersion = async () => {
  const output = `/tmp/${randomUUID()}.json`;
  try {
    await execFileAsync(
      uploaderPath(),
      [
        "list",
        "--all",
        "--filter",
        "Tamriel Savings Co",
        "--page-size",
        "50",
        "--output-json",
        output,
      ],
      { maxBuffer: 1024 * 1024 * 10, env: process.env },
    );
    const addon = findAddon(
      JSON.parse(await fsPromises.readFile(output, "utf8")),
    );
    return addon && versionFromAddon(addon);
  } catch (error) {
    logger.warn(`Unable to check the current TSC addon version: ${error}`);
    return undefined;
  } finally {
    await fsPromises.rm(output, { force: true });
  }
};

const readSourceManifest = async (): Promise<SourceManifest | undefined> => {
  try {
    return JSON.parse(
      await fsPromises.readFile(sourceManifestPath, "utf8"),
    ) as SourceManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
};

const writeSourceManifest = async (manifest: SourceManifest) => {
  await fsPromises.mkdir(path.dirname(sourceManifestPath), { recursive: true });
  const temporaryPath = `${sourceManifestPath}.${process.pid}.${randomUUID()}.tmp`;
  await fsPromises.writeFile(
    temporaryPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await fsPromises.rename(temporaryPath, sourceManifestPath);
};
/* v8 ignore stop */

export const downloadAddon = async (output: string, version?: string) =>
  execFileAsync(
    uploaderPath(),
    [
      "download",
      ADDON_ID,
      ...(version ? ["--version", version] : []),
      `--output=${output}`,
    ],
    {
      maxBuffer: 1024 * 1024 * 50, // 50MB in case tool is chatty
      env: process.env,
    },
  );

export const getAddonData = async () => {
  const random = randomUUID();
  const output = `/tmp/${random}.zip`;
  const unzipTo = `/tmp/${random}`;
  try {
    await self.downloadAddon(output);
    await execFileAsync("unzip", ["-o", output, "-d", unzipTo]);

    return [
      "Playstation/TSCPriceDataPSEU.min.lua",
      "Playstation/TSCPriceDataPSNA.min.lua",
      "XB1/TSCPriceDataXBEU.min.lua",
      "XB1/TSCPriceDataXBNA.min.lua",
    ].flatMap((f) => {
      try {
        const filePath = `${unzipTo}/TSCPriceFetcher2/${f}`;
        logger.info(`Reading: ${filePath}`);
        return [fs.readFileSync(filePath, { encoding: "utf8" })];
      } catch {
        return [];
      }
    });
  } finally {
    await fsPromises.rm(output, { force: true });
    await fsPromises.rm(unzipTo, { recursive: true, force: true });
  }
};

type CollectedObservation = {
  platform: string;
  observation: Awaited<
    ReturnType<typeof Results.from>
  >["observationsByPlatform"][number][1][number];
};

const toSegmentRecord = ({ platform, observation }: CollectedObservation) => ({
  itemId: observation.item.id,
  traitId:
    typeof observation.item.trait === "number" ? observation.item.trait : null,
  qualityId: observation.item.quality,
  server: platform,
  stats: observation.stats,
});

export const collectObservations = async (options?: { maxWrites?: number }) => {
  const previousSource = await readSourceManifest();
  const remoteVersion = await self.getRemoteAddonVersion();
  /* v8 ignore next 9 -- requires a previously imported authenticated release */
  if (
    remoteVersion &&
    previousSource?.remoteVersion === remoteVersion &&
    !options?.maxWrites
  ) {
    logger.info(`TSC addon ${remoteVersion} is already imported`);
    return [];
  }

  const rawData = await self.getAddonData();
  const contentSha256 = createHash("sha256")
    .update(rawData.join("\n"))
    .digest("hex");
  /* v8 ignore next 10 -- requires downloading the same authenticated release */
  if (previousSource?.contentSha256 === contentSha256 && !options?.maxWrites) {
    logger.info("Downloaded TSC price data is unchanged");
    if (remoteVersion && remoteVersion !== previousSource.remoteVersion) {
      await writeSourceManifest({ ...previousSource, remoteVersion });
    }
    return [];
  }

  const r = await Results.from(rawData, options);
  const collected = r.observationsByPlatform.flatMap(
    ([platform, observations]) =>
      observations
        .slice(0, options?.maxWrites ?? observations.length)
        .map((observation) => ({
          platform,
          observation,
        })),
  );
  const legacyChanges = await Promise.all(
    collected.map(({ platform, observation }) =>
      db.throttleFileWrites(async () => {
        logger.info(
          `Logging ${observation.item.meta.name} for ${observation.stats.date}`,
        );
        const targetPath = naming.getObservationPath(
          observation.item,
          observation.stats.date,
          platform,
        );
        return db.writeToFile(observation.stats, targetPath);
      }),
    ),
  );
  const segmentRecords = collected.map(toSegmentRecord);
  const changedSegments = new Set(
    await segments.writeObservationSegments(segmentRecords),
  );
  const changedItemIds = collected
    .filter(
      (_, index) =>
        legacyChanges[index] ||
        changedSegments.has(
          segments.getObservationSegmentPath(segmentRecords[index]),
        ),
    )
    .map(({ observation }) => observation.item.id);

  /* v8 ignore next 8 -- test imports are intentionally partial */
  if (!options?.maxWrites) {
    await writeSourceManifest({
      schemaVersion: 1,
      addonId: ADDON_ID,
      remoteVersion,
      contentSha256,
    });
  }
  return [...new Set(changedItemIds)];
};
