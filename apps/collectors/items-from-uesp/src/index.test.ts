import { beforeAll, describe, expect, it, vi } from "vitest";
import fs from "fs";
import { MinedResults } from "./results";

import * as index from "./index";

const sampleHtml = fs.readFileSync(
  __dirname + "/../docs/sample-mined-item-summary.html",
  "utf8",
);

describe("results", () => {
  const results = MinedResults.from(sampleHtml);

  it("has parsed items", () => {
    expect(results.items).toHaveLength(653); // Only unbound items
  });

  it("has a next url", () => {
    expect(results.next).equals(
      "https://esolog.uesp.net/viewlog.php?start=21000&record=minedItemSummary",
    );
  });
});

describe("crawler", () => {
  let results: Awaited<ReturnType<typeof index.processNextPageOfMinedResults>>;
  vi.spyOn(index, "getHtmlFromEndpoint").mockResolvedValue(sampleHtml);

  beforeAll(async () => {
    results = await index.processNextPageOfMinedResults(undefined, true, {
      maxWrites: 100,
    });
    await index.processNextPageOfLootedResults(undefined, true, {
      maxWrites: 100,
    });
  });

  it("has results", () => {
    expect(results.items).toHaveLength(653); // Only unbound items.
  });

  it("has a next value", () => {
    expect(results.next).equals(
      "https://esolog.uesp.net/viewlog.php?start=21000&record=minedItemSummary",
    );
  });
});

describe("fetching", async () => {
  it.skipIf(process.env.SKIP_SLOW_TESTS)(
    "fails if no next page",
    async () => {
      const results = MinedResults.from(sampleHtml.replaceAll("Next", "blah"));
      await expect(
        async () => await index.processNextPageOfMinedResults(results, true),
      ).rejects.toThrow(/page|found/);
    },
    20_000,
  );
});
