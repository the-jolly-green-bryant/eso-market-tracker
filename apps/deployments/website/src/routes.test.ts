import { describe, expect, it } from "vitest";

import {
  getCategory,
  getDashboard,
  getItem,
  getSearchResults,
  withPlatform,
} from "./routes";

describe("platform market routes", () => {
  it("prefixes market pages with the selected megaserver", () => {
    expect(getDashboard("xbox-na")).toBe("/xbox-na/dashboard/");
    expect(getItem("Dreugh Wax", "ps-eu")).toBe("/ps-eu/item/Dreugh Wax");
    expect(getCategory("Mats (Gold)", "xbox-eu")).toBe(
      "/xbox-eu/category/Mats (Gold)",
    );
    expect(getSearchResults("perfect roe", "ps-na")).toBe(
      "/ps-na/dashboard/perfect%20roe",
    );
  });

  it("keeps non-market paths unchanged until explicitly prefixed", () => {
    expect(getItem("Kuta")).toBe("/item/Kuta");
    expect(withPlatform("/dashboard", "xbox-na")).toBe("/xbox-na/dashboard");
  });
});
