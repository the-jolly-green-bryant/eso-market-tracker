import { describe, expect, it } from "vitest";
import { marketStatsFrom, renderMarketStats } from "./update-market-stats";

describe("website market stats", () => {
  it("derives counts, markets, and freshness from canonical data", () => {
    const stats = marketStatsFrom({
      items: { one: {}, two: {} },
      pricing: { first: {}, second: {}, third: {} },
      observations: {
        segments: {
          "data/segments/observations/xbox-na/2026/08/00.jsonl.gz": {
            records: 12,
            lastDate: "2026-08-10",
          },
          "data/segments/observations/ps-eu/2026/08/00.jsonl.gz": {
            records: 8,
            lastDate: "2026-08-17",
          },
        },
      },
    });

    expect(stats).toEqual({
      trackedItems: 2,
      pricingRecords: 3,
      observations: 20,
      consoleMarkets: 2,
      lastUpdated: "2026-08-17",
    });
    expect(renderMarketStats(stats)).toContain("observations: 20");
    expect(renderMarketStats(stats)).toContain('lastUpdated: "2026-08-17"');
  });

  it("rejects a malformed segment path", () => {
    expect(() =>
      marketStatsFrom({
        items: {},
        pricing: {},
        observations: {
          segments: { invalid: { records: 1, lastDate: "2026-08-17" } },
        },
      }),
    ).toThrow("Invalid observation segment: invalid");
  });
});
