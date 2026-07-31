import { describe, expect, it } from "vitest";

import { getItemVariantMetadata } from "./item-variants";

const price = { average: 100 };

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
