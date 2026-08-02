import { IonIcon } from "@ionic/react";
import {
  analyticsOutline,
  checkmarkCircle,
  codeSlashOutline,
  cubeOutline,
  logoDiscord,
  logoGithub,
  pulseOutline,
  searchOutline,
  serverOutline,
  timeOutline,
} from "ionicons/icons";
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useHistory, useParams } from "react-router-dom";

import LoadingSkeleton from "../components/LoadingSkeleton";
import SearchBar from "../components/SearchBar";
import TopSoldItems from "../components/TopSoldItems";
import TradableItemList from "../components/TradableItemList";
import { ERROR_STATE, LOADING_STATE } from "../components/common";
import * as routes from "../routes";
import { trackSearch } from "../analytics";
import { __useSearch } from "./useItem";
import "./Dashboard.scss";
import { MARKET_STATS } from "../marketStats";
import MarketHeader from "../components/MarketHeader";
import MarketInsights from "../components/MarketInsights";
import SupportBanner from "../components/SupportBanner";
import ExternalLink from "../components/ExternalLink";
import { DISCORD_BOT_INSTALL_LINK } from "../constants";
import { MarketPlatform, PLATFORMS, usePlatform } from "../platform";
import { TradableItemType } from "../models/tradable-item-types";

const accessCards = [
  {
    title: "The website",
    description: "Real-time console prices, history, and market intelligence.",
    href: "https://esomarkettracker.com",
    icon: analyticsOutline,
    action: "Open tracker",
  },
  {
    title: "Explore the API",
    description: "Programmatic access to normalized pricing and item data.",
    href: routes.apiDocs(),
    icon: codeSlashOutline,
    action: "Read the API",
  },
  {
    title: "Install the add-on",
    description: "Install the unified TSC2 price checker for console markets.",
    href: "https://tamrielsavings.com/price-fetcher",
    icon: cubeOutline,
    action: "Get TSC2",
  },
  {
    title: "Discord price bot",
    description: "Run the definitive console price checker inside your server.",
    href: DISCORD_BOT_INSTALL_LINK,
    icon: logoDiscord,
    action: "Add to Discord",
  },
  {
    title: "Data access",
    description: "Download the public dataset and rolling SQLite release.",
    href: "https://github.com/the-jolly-green-bryant/eso-market-tracker/releases/tag/latest",
    icon: serverOutline,
    action: "Download data",
  },
  {
    title: "GitHub",
    description: "Inspect the source, pipeline, history, and methodology.",
    href: "https://github.com/the-jolly-green-bryant/eso-market-tracker",
    icon: logoGithub,
    action: "Browse source",
  },
];

const proofStats = [
  {
    value: MARKET_STATS.trackedItems.toLocaleString(),
    label: "tracked items",
    icon: serverOutline,
  },
  {
    value: MARKET_STATS.pricingRecords.toLocaleString(),
    label: "pricing records",
    icon: analyticsOutline,
  },
  {
    value: MARKET_STATS.observations.toLocaleString(),
    label: "observations",
    icon: pulseOutline,
  },
  {
    value: MARKET_STATS.consoleMarkets.toLocaleString(),
    label: "console markets",
    icon: cubeOutline,
  },
  { value: "Daily", label: "data refresh", icon: timeOutline },
];

const AccessCard = ({ card }: { card: (typeof accessCards)[number] }) => {
  const content = (
    <>
      <IonIcon className="market-access-icon" icon={card.icon} />
      <strong>{card.title}</strong>
      <p>{card.description}</p>
      <span>{card.action} →</span>
    </>
  );

  return card.href.startsWith("http") ? (
    <ExternalLink className="market-access-card" href={card.href}>
      {content}
    </ExternalLink>
  ) : (
    <Link className="market-access-card" to={card.href}>
      {content}
    </Link>
  );
};

const NoResults = () => (
  <div className="market-search-state">
    <LoadingSkeleton
      error={false}
      loading={false}
      title="No matching items"
      message="Try another item name, material, furnishing plan, or gear set."
    />
  </div>
);

const useSearch = (text: string | undefined, platform: MarketPlatform) => {
  const history = useHistory();
  const abortController = useRef<AbortController>();
  const [currentSearch, setCurrentSearch] = useState(text || "");
  const { loading, error, data } = __useSearch(currentSearch);

  const onPerformSearch = (searchText: string) => {
    const trimmed = searchText.trim();
    const newPath = trimmed
      ? routes.getSearchResults(trimmed, platform)
      : routes.getDashboard(platform);
    if (history.location.pathname !== newPath) history.replace(newPath);
    setCurrentSearch(trimmed);
    abortController.current?.abort();
    abortController.current = new window.AbortController();
  };

  return { loading, error, data, onPerformSearch, currentSearch };
};

const ProofBar = () => (
  <section className="market-proof" aria-label="Dataset coverage">
    {proofStats.map(({ value, label, icon }) => (
      <div className="market-proof-stat" key={label}>
        <IonIcon icon={icon} />
        <div>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      </div>
    ))}
  </section>
);

const Hero = ({
  text,
  onPerformSearch,
  searchInputRef,
  searchResultsRef,
  suggestions,
  suggestionsLoading,
  suggestionsQuery,
  compact,
  onSearchFocus,
  children,
}: {
  text?: string;
  onPerformSearch: (text: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  searchResultsRef: React.RefObject<HTMLDivElement>;
  suggestions: TradableItemType[];
  suggestionsLoading: boolean;
  suggestionsQuery: string;
  compact: boolean;
  onSearchFocus: () => void;
  children?: React.ReactNode;
}) => (
  <section className={`market-hero${compact ? " is-searching" : ""}`}>
    <div className="market-hero-art" aria-hidden="true" />
    <div className="market-hero-content">
      <div className="market-kicker">
        <IonIcon icon={checkmarkCircle} />
        Definitive console market intelligence
      </div>
      <h1>Know what it’s worth in ESO.</h1>
      <p>
        Search public ESO prices across Xbox and PlayStation, built for traders
        who would rather know than guess.
      </p>

      <div className="market-command-search">
        <IonIcon icon={searchOutline} />
        <SearchBar
          inputRef={searchInputRef}
          text={text}
          searchCallback={onPerformSearch}
          onClear={() => onPerformSearch("")}
          onFocus={onSearchFocus}
          placeholderText={`Search ${MARKET_STATS.trackedItems.toLocaleString()} console items`}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          suggestionsQuery={suggestionsQuery}
        />
        <kbd>⌘ K</kbd>
      </div>

      <div className="market-popular">
        <span>Popular</span>
        {["Kuta", "Dreugh Wax", "Perfect Roe", "Tempering Alloy"].map(
          (item) => (
            <button key={item} onClick={() => onPerformSearch(item)}>
              {item}
            </button>
          ),
        )}
      </div>

      {children && (
        <div className="market-hero-results" ref={searchResultsRef}>
          {children}
        </div>
      )}
    </div>
  </section>
);

const SearchResults = ({
  currentSearch,
  loading,
  error,
  data,
}: {
  currentSearch: string;
  loading: boolean;
  error: Error | null;
  data: ReturnType<typeof __useSearch>["data"];
}) => (
  <section className="market-results market-item-results">
    <div className="market-section-heading">
      <div>
        <span>Search results</span>
        <h2>“{currentSearch}”</h2>
      </div>
      {!loading && <strong>{data.length.toLocaleString()} matches</strong>}
    </div>
    {loading && LOADING_STATE}
    {error && ERROR_STATE}
    {!loading && !error && data.length > 0 && <TradableItemList items={data} />}
    {!loading && !error && !data.length && <NoResults />}
  </section>
);

const DefaultContent = ({ platform }: { platform: MarketPlatform }) => (
  <>
    <MarketInsights />

    <section className="market-snapshot">
      <div className="market-section-heading">
        <div>
          <span>Market snapshot</span>
          <h2>Gold materials</h2>
        </div>
        <Link to={routes.getCategory("Mats (Gold)", platform)}>
          View category →
        </Link>
      </div>
      <TopSoldItems />
    </section>

    <section className="market-access">
      <div className="market-section-heading">
        <div>
          <span>One dataset, every surface</span>
          <h2>Power your edge</h2>
        </div>
      </div>
      <div className="market-access-grid">
        {accessCards.map((card) => (
          <AccessCard card={card} key={card.title} />
        ))}
      </div>
    </section>

    <section className="market-seo-intro">
      <span>ESO console price checker</span>
      <h2>Check what items are worth before you trade</h2>
      <p>
        Search current Elder Scrolls Online market values for Xbox and
        PlayStation, from Dreugh Wax and Kuta to furnishing plans, motifs, gear,
        and materials. ESO Market Tracker provides public price history and
        recent console market observations for more than{" "}
        {MARKET_STATS.trackedItems.toLocaleString()} items.
      </p>
      <p>
        Looking for Tamriel Savings Co, the TSC price checker, or SavageTSC?{" "}
        <Link to={routes.tamrielSavingsAlternative()}>
          Compare the independent ESO Market Tracker alternative.
        </Link>
      </p>
    </section>
  </>
);

// eslint-disable-next-line max-lines-per-function
export default () => {
  const { text } = useParams<{ text: string | undefined }>();
  const { platform } = usePlatform();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const marketScrollRef = useRef<HTMLElement>(null);
  const keyboardBaselineHeightRef = useRef(0);
  const lastTrackedSearchRef = useRef("");
  const [hasSearched, setHasSearched] = useState(Boolean(text));
  const { loading, error, data, onPerformSearch, currentSearch } = useSearch(
    text,
    platform,
  );
  const handlePerformSearch = (searchText: string) => {
    if (searchText.trim()) setHasSearched(true);
    onPerformSearch(searchText);
  };
  const handleSearchFocus = () => {
    if (window.matchMedia("(max-width: 620px)").matches) {
      setHasSearched(true);
    }
  };
  const platformLabel = PLATFORMS[platform];
  const canonicalUrl = `https://esomarkettracker.com${routes.getDashboard(platform)}`;

  useEffect(() => {
    if (text) onPerformSearch(text);
  }, []);

  useEffect(() => {
    if (currentSearch && data && !loading && !error) {
      const searchKey = `${platform}:${currentSearch.trim().toLowerCase()}`;
      if (searchKey === lastTrackedSearchRef.current) return;
      lastTrackedSearchRef.current = searchKey;
      trackSearch(currentSearch, data.length, platform);
    }
  }, [currentSearch, data, loading, error, platform]);

  useEffect(() => {
    const focusSearch = (event: globalThis.KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    const scrollArea = marketScrollRef.current;
    const searchInput = searchInputRef.current;
    if (!scrollArea) return;

    const visualViewport = window.visualViewport;
    const syncViewport = () => {
      const visibleHeight = visualViewport?.height ?? window.innerHeight;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportExtent = visibleHeight + viewportTop;
      const inputIsFocused = document.activeElement === searchInput;

      if (!inputIsFocused) {
        keyboardBaselineHeightRef.current = viewportExtent;
      } else if (!keyboardBaselineHeightRef.current) {
        keyboardBaselineHeightRef.current = Math.max(
          window.innerHeight,
          viewportExtent,
        );
      }

      const keyboardInset = inputIsFocused
        ? Math.max(0, keyboardBaselineHeightRef.current - viewportExtent)
        : 0;

      scrollArea.style.setProperty(
        "--market-visual-viewport-height",
        `${Math.round(visibleHeight)}px`,
      );
      scrollArea.style.setProperty(
        "--market-keyboard-inset",
        `${Math.round(keyboardInset)}px`,
      );
      scrollArea.classList.toggle(
        "is-keyboard-open",
        inputIsFocused && keyboardInset >= 80,
      );
    };

    syncViewport();
    visualViewport?.addEventListener("resize", syncViewport);
    visualViewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    searchInput?.addEventListener("focus", syncViewport);
    searchInput?.addEventListener("blur", syncViewport);

    return () => {
      visualViewport?.removeEventListener("resize", syncViewport);
      visualViewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      searchInput?.removeEventListener("focus", syncViewport);
      searchInput?.removeEventListener("blur", syncViewport);
      scrollArea.style.removeProperty("--market-visual-viewport-height");
      scrollArea.style.removeProperty("--market-keyboard-inset");
      scrollArea.classList.remove("is-keyboard-open");
    };
  }, []);

  useEffect(() => {
    if (!currentSearch || loading || error || data.length === 0) return;

    const scrollArea = marketScrollRef.current;
    const searchInput = searchInputRef.current;
    const results = searchResultsRef.current;
    if (!scrollArea || !searchInput || !results) return;

    const visualViewport = window.visualViewport;
    let animationFrame = 0;
    const revealFirstResult = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        if (
          document.activeElement !== searchInput ||
          !window.matchMedia("(max-width: 620px)").matches
        ) {
          return;
        }

        const firstResult = results.querySelector<HTMLElement>(
          ".tradable-item-reference",
        );
        if (!firstResult) return;

        const viewportBottom =
          (visualViewport?.offsetTop ?? 0) +
          (visualViewport?.height ?? window.innerHeight) -
          12;
        const overlap =
          firstResult.getBoundingClientRect().bottom - viewportBottom;

        if (overlap > 0) {
          scrollArea.scrollTop += Math.ceil(overlap + 12);
        }
      });
    };

    revealFirstResult();
    visualViewport?.addEventListener("resize", revealFirstResult);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      visualViewport?.removeEventListener("resize", revealFirstResult);
    };
  }, [currentSearch, loading, error, data.length]);

  return (
    <div className="market-home">
      <Helmet>
        <title>Elder Scrolls Online Price Checker | ESO Market Tracker</title>
        <meta
          name="description"
          content="Check Elder Scrolls Online item prices for Xbox and PlayStation. Search current ESO market values and price history for Dreugh Wax, Kuta, motifs, gear, and 44,000+ items."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta
          property="og:title"
          content="Elder Scrolls Online Price Checker for Console"
        />
        <meta
          property="og:description"
          content="Search current console prices and market history for more than 44,000 Elder Scrolls Online items."
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="ESO Market Tracker" />
        <meta
          property="og:image"
          content="https://esomarkettracker.com/assets/images/icon-marketing.png"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                name: "ESO Market Tracker",
                alternateName: [
                  "ESO Price Checker",
                  "Elder Scrolls Online Price Checker",
                ],
                url: "https://esomarkettracker.com/",
                potentialAction: {
                  "@type": "SearchAction",
                  target: `https://esomarkettracker.com/${platform}/dashboard/{search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "WebApplication",
                name: "ESO Market Tracker",
                applicationCategory: "GameApplication",
                operatingSystem: "Web",
                url: canonicalUrl,
                description: `An Elder Scrolls Online market tracker and price checker for ${platformLabel}.`,
              },
            ],
          })}
        </script>
      </Helmet>

      <MarketHeader />

      <main className="market-home-scroll" ref={marketScrollRef}>
        <Hero
          text={text}
          onPerformSearch={handlePerformSearch}
          searchInputRef={searchInputRef}
          searchResultsRef={searchResultsRef}
          suggestions={data}
          suggestionsLoading={loading}
          suggestionsQuery={currentSearch}
          compact={hasSearched}
          onSearchFocus={handleSearchFocus}
        >
          {currentSearch ? (
            <SearchResults
              currentSearch={currentSearch}
              loading={loading}
              error={error}
              data={data}
            />
          ) : undefined}
        </Hero>

        <div className="market-content">
          <ProofBar />

          {!currentSearch && <DefaultContent platform={platform} />}
        </div>

        <footer className="market-footer">
          <SupportBanner />
        </footer>
      </main>
    </div>
  );
};
