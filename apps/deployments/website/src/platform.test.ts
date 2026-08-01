import { describe, expect, it } from "vitest";

import {
  getPlatformFromPath,
  getPlatformFromSearch,
  removePlatformFromSearch,
  setPlatformInPath,
} from "./platform";

describe("market platform URLs", () => {
  it("reads supported platforms from the first path segment", () => {
    expect(getPlatformFromPath("/ps-na/item/Kuta")).toBe("ps-na");
    expect(getPlatformFromPath("/dashboard/")).toBeNull();
    expect(getPlatformFromPath("/switch/item/Kuta")).toBeNull();
  });

  it("replaces or inserts the platform segment", () => {
    expect(setPlatformInPath("/xbox-na/item/Kuta", "ps-eu")).toBe(
      "/ps-eu/item/Kuta",
    );
    expect(setPlatformInPath("/category/Mats", "xbox-eu")).toBe(
      "/xbox-eu/category/Mats",
    );
    expect(setPlatformInPath("/about", "ps-na")).toBe("/ps-na/dashboard/");
  });

  it("supports legacy query links without preserving the platform query", () => {
    expect(getPlatformFromSearch("?platform=ps-eu&utm_source=test")).toBe(
      "ps-eu",
    );
    expect(removePlatformFromSearch("?platform=ps-eu&utm_source=test")).toBe(
      "?utm_source=test",
    );
  });
});
