#!/usr/bin/env -S tsx
import "dotenv/config";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildAddon,
  buildApi,
  importObservations,
  prepareDatabase,
} from "./index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteDirectory = path.resolve(
  __dirname,
  "../../../deployments/website",
);
const startedAt = performance.now();
const stageSeconds: Record<string, number> = {};

const timed = async <T>(label: string, operation: () => Promise<T>) => {
  const stageStartedAt = performance.now();
  try {
    return await operation();
  } finally {
    const elapsed = (performance.now() - stageStartedAt) / 1000;
    stageSeconds[label] = elapsed;
    console.log(`${label}: ${elapsed.toFixed(2)}s`);
  }
};

const writeOutputs = (changedItemCount: number) => {
  const totalSeconds = (performance.now() - startedAt) / 1000;
  const stats = {
    changedItemCount,
    stageSeconds,
    totalSeconds,
  };

  if (process.env.ESO_UPDATE_STATS_PATH) {
    fs.writeFileSync(
      process.env.ESO_UPDATE_STATS_PATH,
      `${JSON.stringify(stats, null, 2)}\n`,
    );
  }
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `changed_item_count=${changedItemCount}\n` +
        `total_seconds=${totalSeconds.toFixed(2)}\n`,
    );
  }
};

const itemIds = await timed("Collect observations", importObservations);

if (itemIds.length === 0) {
  writeOutputs(0);
  console.log("No observations were collected; nothing to rebuild.");
  process.exit(0);
}

console.log(`Rebuilding ${itemIds.length} changed items.`);
await timed("Build incremental pricing", () => prepareDatabase(itemIds));
if (process.env.ESO_SKIP_REMOTE_PUBLISH === "1") {
  console.log("Publish incremental API: skipped");
} else {
  await timed("Publish incremental API", () =>
    buildApi({ internalIds: itemIds }),
  );
}
await timed("Build addon", buildAddon);

await timed("Build incremental website", async () => {
  const changedItemIdsPath = path.join(
    process.env.RUNNER_TEMP || os.tmpdir(),
    "eso-changed-item-ids.txt",
  );
  fs.writeFileSync(changedItemIdsPath, itemIds.join(","));

  execFileSync("pnpm", ["run", "build:static:incremental"], {
    cwd: websiteDirectory,
    stdio: "inherit",
    env: {
      ...process.env,
      ESO_CHANGED_ITEM_IDS_FILE: changedItemIdsPath,
    },
  });
});

writeOutputs(itemIds.length);
