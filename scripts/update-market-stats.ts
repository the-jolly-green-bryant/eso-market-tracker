import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type ObservationManifest = {
  segments: Record<string, { lastDate: string; records: number }>;
};

type MarketStatsInput = {
  items: Record<string, unknown>;
  observations: ObservationManifest;
  pricing: Record<string, unknown>;
};

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const readJson = <T>(filePath: string): T =>
  JSON.parse(fs.readFileSync(filePath, "utf8")) as T;

export const marketStatsFrom = ({
  items,
  observations,
  pricing,
}: MarketStatsInput) => {
  const segments = Object.entries(observations.segments);
  const markets = new Set(
    segments.map(([segmentPath]) => {
      const match = /\/observations\/([^/]+)\//.exec(segmentPath);
      if (!match)
        throw new Error(`Invalid observation segment: ${segmentPath}`);
      return match[1];
    }),
  );
  const lastUpdated = segments
    .map(([, segment]) => segment.lastDate)
    .sort((left, right) => left.localeCompare(right))
    .at(-1);
  if (!lastUpdated) throw new Error("Observation manifest has no segments");

  return {
    trackedItems: Object.keys(items).length,
    pricingRecords: Object.keys(pricing).length,
    observations: segments.reduce(
      (total, [, segment]) => total + segment.records,
      0,
    ),
    consoleMarkets: markets.size,
    lastUpdated,
  };
};

const formatInteger = (value: number) =>
  value.toLocaleString("en-US").replaceAll(",", "_");

export const renderMarketStats = (
  stats: ReturnType<typeof marketStatsFrom>,
) => `export const MARKET_STATS = {
  trackedItems: ${formatInteger(stats.trackedItems)},
  pricingRecords: ${formatInteger(stats.pricingRecords)},
  observations: ${formatInteger(stats.observations)},
  consoleMarkets: ${formatInteger(stats.consoleMarkets)},
  lastUpdated: "${stats.lastUpdated}",
} as const;
`;

export const updateMarketStats = () => {
  const stats = marketStatsFrom({
    items: readJson(path.join(repositoryRoot, "data/index/master-items.json")),
    observations: readJson(
      path.join(repositoryRoot, "data/manifests/observations.json"),
    ),
    pricing: readJson(
      path.join(repositoryRoot, "data/index/master-pricing.json"),
    ),
  });
  const outputPath = path.join(
    repositoryRoot,
    "apps/deployments/website/src/marketStats.ts",
  );
  fs.writeFileSync(outputPath, renderMarketStats(stats));
  console.log(
    `Updated website market stats from ${stats.lastUpdated} ` +
      `(${stats.observations.toLocaleString("en-US")} observations).`,
  );
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  updateMarketStats();
}
