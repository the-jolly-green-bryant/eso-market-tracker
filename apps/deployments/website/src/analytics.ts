export const GA_MEASUREMENT_ID = "G-TZ24DG3P0Z";

type AnalyticsParameters = Record<string, unknown>;
type SearchPlatform = "xbox-na" | "xbox-eu" | "ps-na" | "ps-eu";

const SEARCH_COUNT_SESSION_KEY = "emt-search-count-session-v1";
const SEARCH_COUNT_VISITOR_KEY = "emt-search-count-visitor-v1";

declare global {
  interface Window {
    gtag?: (
      command: "config" | "event",
      target: string,
      parameters?: AnalyticsParameters,
    ) => void;
  }
}

const sendEvent = (name: string, parameters?: AnalyticsParameters) => {
  if (
    typeof window === "undefined" ||
    !window.gtag ||
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ) {
    return;
  }
  window.gtag("event", name, parameters);
};

let previousPagePath: string | undefined;

const incrementStoredCounter = (
  storageName: "localStorage" | "sessionStorage",
  key: string,
) => {
  try {
    const storage = window[storageName];
    const stored = Number.parseInt(storage.getItem(key) ?? "0", 10);
    const next = (Number.isFinite(stored) && stored >= 0 ? stored : 0) + 1;
    storage.setItem(key, String(next));
    return next;
  } catch {
    // Analytics must never interfere with search when storage is unavailable.
    return undefined;
  }
};

export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (pagePath === previousPagePath) return;
  previousPagePath = pagePath;
  sendEvent("page_view", {
    page_location: window.location.href,
    page_path: pagePath,
    page_title: pageTitle,
  });
};

export const trackSearch = (
  searchTerm: string,
  resultCount: number,
  marketPlatform: SearchPlatform,
) => {
  const normalized = searchTerm.replace(/\s+/g, " ").trim().slice(0, 100);
  if (!normalized) return;

  const searchCountSession = incrementStoredCounter(
    "sessionStorage",
    SEARCH_COUNT_SESSION_KEY,
  );
  const searchCountVisitor = incrementStoredCounter(
    "localStorage",
    SEARCH_COUNT_VISITOR_KEY,
  );
  const parameters: AnalyticsParameters = {
    search_term: normalized,
    result_count: Math.max(0, Math.trunc(resultCount)),
    has_results: resultCount > 0,
    market_platform: marketPlatform,
  };

  if (searchCountSession != null) {
    parameters.search_count_session = searchCountSession;
  }
  if (searchCountVisitor != null) {
    parameters.search_count_visitor = searchCountVisitor;
  }

  sendEvent("search", parameters);
};

export const trackItemView = (item: {
  slug: string;
  displayLabel: string;
  category?: string;
  price?: number;
}) =>
  sendEvent("view_item", {
    market_price_gold: item.price,
    items: [
      {
        item_id: item.slug,
        item_name: item.displayLabel,
        item_category: item.category,
      },
    ],
  });

export const trackItemSelection = (
  item: { slug: string; displayLabel: string },
  itemListName: string,
) =>
  sendEvent("select_item", {
    item_list_name: itemListName,
    items: [{ item_id: item.slug, item_name: item.displayLabel }],
  });

export const trackCategoryView = (category: string, resultCount: number) =>
  sendEvent("view_item_list", {
    item_list_id: category,
    item_list_name: category,
    result_count: resultCount,
  });
