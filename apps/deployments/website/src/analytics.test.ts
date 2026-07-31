// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import { trackSearch } from "./analytics";

describe("search analytics", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("tracks per-session and per-browser search counts", () => {
    trackSearch("Kuta", 10, "xbox-na");
    trackSearch("Dreugh Wax", 4, "ps-eu");

    expect(window.sessionStorage.getItem("emt-search-count-session-v1")).toBe(
      "2",
    );
    expect(window.localStorage.getItem("emt-search-count-visitor-v1")).toBe(
      "2",
    );
  });

  it("does not increment counters for an empty search", () => {
    trackSearch("   ", 0, "xbox-na");

    expect(
      window.sessionStorage.getItem("emt-search-count-session-v1"),
    ).toBeNull();
    expect(
      window.localStorage.getItem("emt-search-count-visitor-v1"),
    ).toBeNull();
  });
});
