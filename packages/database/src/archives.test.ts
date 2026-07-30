import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getItemPricingArchivePath,
  readItemPricingArchive,
  writeItemPricingArchive,
} from "./archives";

describe("item pricing archives", () => {
  it("round-trips deterministic, sorted history entries", async () => {
    const repositoryRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "eso-archive-"),
    );
    const itemId = 123456;
    const histories = {
      "123456------.xbox-na.historical.json": [
        {
          average: 20,
          date: "2026-07-29",
          commonQuantity: 1,
          minimum: 10,
          maximum: 30,
        },
      ],
      "123456-04-02.ps-na.historical.json": [
        {
          average: 10,
          date: "2026-07-28",
          commonQuantity: 1,
          minimum: 5,
          maximum: 15,
        },
      ],
    };

    await expect(
      writeItemPricingArchive(itemId, histories, { repositoryRoot }),
    ).resolves.toBe(true);
    const archivePath = path.join(
      repositoryRoot,
      getItemPricingArchivePath(itemId),
    );
    const firstBytes = await fs.readFile(archivePath);

    await expect(
      writeItemPricingArchive(itemId, histories, { repositoryRoot }),
    ).resolves.toBe(false);
    expect(await fs.readFile(archivePath)).toEqual(firstBytes);
    await expect(
      readItemPricingArchive(itemId, { repositoryRoot }),
    ).resolves.toEqual(histories);
  });
});
