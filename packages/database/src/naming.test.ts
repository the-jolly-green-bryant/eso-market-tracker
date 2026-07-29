import { describe, expect, it } from "vitest";
import { getItemPath, getItemPathFromId, getObservationPath } from "./naming";
import { XBOX_NA } from "./constants";
import { constants } from "@eso-market-tracker/eso";

describe("item to directory", () => {
  it("returns a valid, sharded path", () => {
    expect(getItemPath(constants.SAMPLE_BASE_ITEM)).toBe(
      "data/items/89/16/22/2928226198.json",
    );
    expect(getItemPathFromId(constants.SAMPLE_BASE_ITEM.id)).toBe(
      "data/items/89/16/22/2928226198.json",
    );
  });

  it("handles observation quality and trait", () => {
    expect(
      getObservationPath(constants.SAMPLE_VARIANT_ITEM, "2026-01-01", XBOX_NA),
    ).toEqual(
      `data/observations/89/16/22/2928226198/2928226198-42---/xbox-na/2026/01/01.json`,
    );
  });
});
