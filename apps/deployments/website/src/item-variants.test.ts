import { describe, expect, it } from "vitest";

import {
  getItemVariantMetadata,
  getItemVariantOptions,
  getItemVariantStats,
} from "./item-variants";

const price = {
  average: 100,
  commonQuantity: 1,
  date: "2026-07-30",
  maximum: 140,
  minimum: 80,
};

describe("getItemVariantMetadata", () => {
  it("lists aggregate and companion variants without duplicates", () => {
    expect(
      getItemVariantMetadata({
        "--": { "--": price, "02": price },
        "34": { "--": price, "02": price, "03": price },
        "43": { "04": price },
        "42": { "04": price },
      }),
    ).toEqual({
      traits: ["All", "Quickened", "Vigorous"],
      qualities: ["All", "Fine", "Superior", "Epic"],
    });
  });

  it("does not show empty aggregate-only metadata", () => {
    expect(getItemVariantMetadata({ "--": { "--": price } })).toEqual({
      traits: [],
      qualities: [],
    });
  });

  it("keeps unknown variants visible", () => {
    expect(
      getItemVariantMetadata({
        "61": { "06": price },
      }),
    ).toEqual({
      traits: ["Trait 61"],
      qualities: ["Quality 6"],
    });
  });
});

describe("selectable item variants", () => {
  const raw = {
    "--": { "--": price, "02": { ...price, average: 200 } },
    "34": {
      "--": { ...price, average: 1_000 },
      "02": { ...price, average: 2_000 },
      "04": { ...price, average: 8_000 },
    },
    "42": {
      "--": { ...price, average: 3_000 },
      "03": { ...price, average: 4_000 },
    },
  };

  it("defaults to aggregate options and scopes qualities by trait", () => {
    expect(getItemVariantOptions(raw)).toEqual({
      traits: [
        { id: "--", label: "All traits" },
        { id: "34", label: "Quickened" },
        { id: "42", label: "Vigorous" },
      ],
      qualities: [
        { id: "--", label: "All qualities" },
        { id: "02", label: "Fine" },
      ],
    });

    expect(getItemVariantOptions(raw, "34").qualities).toEqual([
      { id: "--", label: "All qualities" },
      { id: "02", label: "Fine" },
      { id: "04", label: "Epic" },
    ]);
  });

  it("returns price statistics for the exact selected pair", () => {
    expect(getItemVariantStats(raw, "34", "04")).toMatchObject({
      averageUnitPrice: 8_000,
      commonUnitPriceRangeLower: 80,
      commonUnitPriceRangeUpper: 140,
      greenAverageUnitPrice: 2_000,
      purpleAverageUnitPrice: 8_000,
    });
    expect(getItemVariantStats(raw, "--", "--")?.averageUnitPrice).toBe(100);
  });
});
