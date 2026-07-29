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

const itemIds = await importObservations();

if (itemIds.length === 0) {
  console.log("No observations were collected; nothing to rebuild.");
  process.exit(0);
}

console.log(`Rebuilding ${itemIds.length} changed items.`);
await prepareDatabase(itemIds);
await buildApi({ internalIds: itemIds });
await buildAddon();

execFileSync("pnpm", ["run", "build:static:incremental"], {
  cwd: websiteDirectory,
  stdio: "inherit",
  env: {
    ...process.env,
    ESO_CHANGED_ITEM_IDS: itemIds.join(","),
  },
});
