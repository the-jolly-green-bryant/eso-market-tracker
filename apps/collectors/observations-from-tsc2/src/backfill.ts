#!/usr/bin/env -S tsx
import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { history, segments } from "@eso-market-tracker/database";
import { logger, orThrow } from "@eso-market-tracker/logging";
import { downloadAddon } from "./index";
import { Results } from "./results";
import { TSC2_RELEASES, type TscAddonRelease } from "./releases";

const DATA_FILE = /(?:^|\/)TSCPriceData(?:XBNA|XBEU|PSNA|PSEU)\.min\.lua$/;

export const readPriceDataFromArchive = (archivePath: string) => {
  const zip = new AdmZip(archivePath);
  const files = zip
    .getEntries()
    .filter((entry) => !entry.isDirectory && DATA_FILE.test(entry.entryName))
    .map((entry) => entry.getData().toString("utf8"));

  if (files.length === 0) {
    throw new Error(`No TSC price data found in ${archivePath}`);
  }
  return files;
};

const archivePathFor = (archiveDir: string, version: string) =>
  path.join(archiveDir, `tsc2-${version}.zip`);

/* v8 ignore start -- exercised with authenticated release archives */
export const downloadReleaseArchives = async (
  archiveDir: string,
  releases: TscAddonRelease[],
) => {
  await fs.mkdir(archiveDir, { recursive: true });
  for (const release of releases) {
    const archivePath = archivePathFor(archiveDir, release.version);
    try {
      await fs.access(archivePath);
      logger.info(`TSC2 ${release.version} is already downloaded`);
    } catch {
      logger.info(`Downloading TSC2 ${release.version}`);
      await downloadAddon(archivePath, release.version);
    }
  }
};

type CollectedReleaseRecord = {
  server: string;
  observation: Awaited<
    ReturnType<typeof Results.from>
  >["observationsByPlatform"][number][1][number];
};

const collectRelease = async (archiveDir: string, release: TscAddonRelease) => {
  const archivePath = archivePathFor(archiveDir, release.version);
  const rawData = readPriceDataFromArchive(archivePath);
  logger.info(`Parsing TSC2 ${release.version} as ${release.observationDate}`);
  const results = await Results.from(rawData, {
    observationDate: release.observationDate,
  });
  const parsed: CollectedReleaseRecord[] =
    results.observationsByPlatform.flatMap(([server, observations]) =>
      observations.map((observation) => ({ server, observation })),
    );
  const uniqueByHistory = new Map<string, CollectedReleaseRecord>();
  for (const record of parsed) {
    uniqueByHistory.set(
      history.getItemHistoryPath({
        item: record.observation.item,
        server: record.server,
      }),
      record,
    );
  }
  const collected = [...uniqueByHistory.values()];
  logger.info(
    `Parsed ${parsed.length.toLocaleString()} rows into ${collected.length.toLocaleString()} unique observations from TSC2 ${release.version}`,
  );
  return { collected, rawCount: parsed.length };
};

const addHistoryProjections = (
  historyByPath: Map<string, history.ItemHistoryProjection>,
  collected: CollectedReleaseRecord[],
) => {
  for (const { server, observation } of collected) {
    const relativePath = history.getItemHistoryPath({
      item: observation.item,
      server,
    });
    const projection = historyByPath.get(relativePath);
    if (projection) projection.additions.push(observation.stats);
    else {
      historyByPath.set(relativePath, {
        relativePath,
        additions: [observation.stats],
      });
    }
  }
};

export const backfillReleaseArchives = async (
  archiveDir: string,
  releases: TscAddonRelease[],
) => {
  const historyByPath = new Map<string, history.ItemHistoryProjection>();
  const changedSegments = new Set<string>();
  let observationCount = 0;
  let rawObservationCount = 0;

  for (const release of releases) {
    const { collected, rawCount } = await collectRelease(archiveDir, release);
    rawObservationCount += rawCount;
    observationCount += collected.length;

    const segmentRecords = collected.map(({ server, observation }) => ({
      itemId: observation.item.id,
      traitId:
        typeof observation.item.trait === "number"
          ? observation.item.trait
          : null,
      qualityId: observation.item.quality,
      server,
      stats: observation.stats,
    }));
    for (const changed of await segments.writeObservationSegments(
      segmentRecords,
      { preserveExisting: true },
    )) {
      changedSegments.add(changed);
    }

    addHistoryProjections(historyByPath, collected);
  }

  logger.info(
    `Writing ${historyByPath.size.toLocaleString()} compact history projections`,
  );
  const changedHistories = await history.writeItemHistoryProjections(
    [...historyByPath.values()],
    { preserveExisting: true },
  );
  return {
    releases: releases.length,
    observations: observationCount,
    rawObservations: rawObservationCount,
    changedSegments: changedSegments.size,
    changedHistories: changedHistories.length,
  };
};
/* v8 ignore stop */

/* v8 ignore start -- command-line argument handling */
const argumentValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv
    .find((argument) => argument.startsWith(prefix))
    ?.slice(prefix.length);
};

const run = async () => {
  const archiveDir =
    argumentValue("archive-dir") ||
    process.env.TSC_ARCHIVE_DIR ||
    orThrow(
      new Error(
        "Provide --archive-dir=/path/to/archives or set TSC_ARCHIVE_DIR",
      ),
    );
  const requestedVersions = new Set(
    (argumentValue("versions") ?? "")
      .split(",")
      .map((version) => version.trim())
      .filter(Boolean),
  );
  const releases = requestedVersions.size
    ? TSC2_RELEASES.filter(({ version }) => requestedVersions.has(version))
    : TSC2_RELEASES;

  if (releases.length === 0) {
    throw new Error("No matching TSC2 releases were selected");
  }
  if (process.argv.includes("--download")) {
    await downloadReleaseArchives(archiveDir, releases);
  }
  const summary = await backfillReleaseArchives(archiveDir, releases);
  console.log(JSON.stringify(summary, null, 2));
};

if (import.meta.url === `file://${process.argv[1]}`) {
  void run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
/* v8 ignore stop */
