#!/usr/bin/env -S tsx
import "dotenv/config";
import { execFileSync } from "node:child_process";
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

const timed = async <T>(label: string, operation: () => Promise<T>) => {
  const startedAt = performance.now();
  try {
    return await operation();
  } finally {
    console.log(
      `${label}: ${((performance.now() - startedAt) / 1000).toFixed(2)}s`,
    );
  }
};

const itemIds = await timed("Collect observations", importObservations);

if (itemIds.length === 0) {
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
  execFileSync("pnpm", ["run", "build:static:incremental"], {
    cwd: websiteDirectory,
    stdio: "inherit",
    env: {
      ...process.env,
      ESO_CHANGED_ITEM_IDS: itemIds.join(","),
    },
  });
});
