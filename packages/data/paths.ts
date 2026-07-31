import path from "node:path";

export const repositoryRoot = path.resolve(import.meta.dirname, "../..");

export const marketDataRoot = path.resolve(
  process.env.ESO_MARKET_DATA_ROOT ?? path.join(repositoryRoot, "data"),
);

export const marketDataPath = (...segments: string[]) =>
  path.join(marketDataRoot, ...segments);
