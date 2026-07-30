import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { readPriceDataFromArchive } from "./backfill";
import { TSC2_RELEASES } from "./releases";

describe("TSC2 release backfill", () => {
  it("extracts both legacy root and current nested price data layouts", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "tsc2-archive-"));
    const archivePath = path.join(directory, "release.zip");
    const zip = new AdmZip();
    zip.addFile("TSCPriceDataXBNA.min.lua", Buffer.from("root"));
    zip.addFile(
      "TSCPriceFetcher2/Playstation/TSCPriceDataPSEU.min.lua",
      Buffer.from("nested"),
    );
    zip.addFile(
      "TSCPriceFetcher2/TSCPriceFetcher2.lua",
      Buffer.from("ignored"),
    );
    zip.writeZip(archivePath);

    expect(readPriceDataFromArchive(archivePath)).toEqual(["root", "nested"]);
  });

  it("records every published TSC2 release in chronological order", () => {
    expect(TSC2_RELEASES.map(({ version }) => version)).toEqual(
      Array.from({ length: 16 }, (_, index) => String(index + 100)),
    );
    expect(TSC2_RELEASES.map(({ observationDate }) => observationDate)).toEqual(
      [...TSC2_RELEASES]
        .map(({ observationDate }) => observationDate)
        .sort((left, right) => left.localeCompare(right)),
    );
  });
});
