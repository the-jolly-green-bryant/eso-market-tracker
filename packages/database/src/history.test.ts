import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Item } from "@eso-market-tracker/eso";
import { writeItemHistories, writeItemHistoryProjections } from "./history";
import { getItemDirectory, getQualifiedItem } from "./naming";

describe("item history projections", () => {
  it("skips empty batches", async () => {
    await expect(writeItemHistories([])).resolves.toEqual([]);
    await expect(writeItemHistoryProjections([])).resolves.toEqual([]);
  });

  it("merges, deduplicates, sorts, and updates the current projection", async () => {
    const repositoryRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "eso-history-"),
    );
    const item = Item.from({
      internalId: 123456,
      name: "Test Item",
      knownIds: [],
      icon: "",
      description: "",
      bindType: 0,
    });
    const relativePath = `${getItemDirectory(item)}/${getQualifiedItem(item)}.xbox-na.historical.json`;
    const historicalPath = path.join(repositoryRoot, relativePath);
    await fs.mkdir(path.dirname(historicalPath), { recursive: true });
    await fs.writeFile(
      historicalPath,
      JSON.stringify({
        0: {
          average: 10,
          date: "2026-03-02",
          commonQuantity: 1,
          minimum: 5,
          maximum: 15,
        },
      }),
    );

    await writeItemHistories(
      [
        {
          item,
          server: "xbox-na",
          stats: {
            average: 20,
            date: "2026-03-07",
            commonQuantity: 1,
            minimum: 10,
            maximum: 30,
          },
        },
        {
          item,
          server: "xbox-na",
          stats: {
            average: 12,
            date: "2026-03-02",
            commonQuantity: 1,
            minimum: 6,
            maximum: 18,
          },
        },
      ],
      { repositoryRoot },
    );

    const history = JSON.parse(await fs.readFile(historicalPath, "utf8"));
    const current = JSON.parse(
      await fs.readFile(
        historicalPath.replace(".historical.json", ".current.json"),
        "utf8",
      ),
    );
    expect(Object.values(history)).toEqual([
      expect.objectContaining({ date: "2026-03-02", average: 12 }),
      expect.objectContaining({ date: "2026-03-07", average: 20 }),
    ]);
    expect(current).toEqual(
      expect.objectContaining({ date: "2026-03-07", average: 20 }),
    );
  });
});
