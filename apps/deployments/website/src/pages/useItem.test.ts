import { describe, expect, it } from "vitest";

import { getItemHistoryEntryName } from "./useItem";

describe("item variant history", () => {
  it("builds aggregate and exact variant archive entries", () => {
    expect(getItemHistoryEntryName(79148134, "xbox-na")).toBe(
      "79148134------.xbox-na.historical.json",
    );
    expect(getItemHistoryEntryName(79148134, "xbox-na", "34", "04")).toBe(
      "79148134-34-04.xbox-na.historical.json",
    );
  });
});
