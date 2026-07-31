// @vitest-environment jsdom

import { Capacitor } from "@capacitor/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { trackSearch } from "./analytics";

describe("search analytics", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete window.gtag;
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

  it("sends native app events from the Capacitor localhost origin", () => {
    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
    vi.spyOn(Capacitor, "getPlatform").mockReturnValue("android");
    window.gtag = vi.fn();

    trackSearch("Kuta", 10, "xbox-na");

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "search",
      expect.objectContaining({
        app_surface: "app",
        app_platform: "android",
        search_term: "Kuta",
      }),
    );
  });
});
