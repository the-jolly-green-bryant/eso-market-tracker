import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useHistory, useLocation } from "react-router-dom";

export const PLATFORMS = {
  "xbox-na": "Xbox NA",
  "xbox-eu": "Xbox EU",
  "ps-na": "PlayStation NA",
  "ps-eu": "PlayStation EU",
} as const;

/** A supported ESO console megaserver. */
export type MarketPlatform = keyof typeof PLATFORMS;

export const DEFAULT_PLATFORM: MarketPlatform = "xbox-na";

const isMarketPlatform = (value: string | null): value is MarketPlatform =>
  value !== null && value in PLATFORMS;

export const getPlatformFromSearch = (
  search: string,
): MarketPlatform | null => {
  const value = new URLSearchParams(search).get("platform");
  return isMarketPlatform(value) ? value : null;
};

export const getPlatformFromPath = (
  pathname: string,
): MarketPlatform | null => {
  const value = pathname.split("/").filter(Boolean)[0] ?? null;
  return isMarketPlatform(value) ? value : null;
};

export const removePlatformFromSearch = (search: string) => {
  const params = new URLSearchParams(search);
  params.delete("platform");
  const value = params.toString();
  return value ? `?${value}` : "";
};

export const setPlatformInPath = (
  pathname: string,
  platform: MarketPlatform,
) => {
  const currentPlatform = getPlatformFromPath(pathname);
  if (currentPlatform) {
    return pathname.replace(`/${currentPlatform}`, `/${platform}`);
  }
  if (
    pathname === "/" ||
    /^\/(?:dashboard|item|categories|category)(?:\/|$)/.test(pathname)
  ) {
    const marketPath = pathname === "/" ? "/dashboard/" : pathname;
    return `/${platform}${marketPath}`;
  }
  return `/${platform}/dashboard/`;
};

type PlatformContextValue = {
  platform: MarketPlatform;
  setPlatform: (platform: MarketPlatform) => void;
};

const PlatformContext = createContext<PlatformContextValue>({
  platform: DEFAULT_PLATFORM,
  setPlatform: () => undefined,
});

export const PlatformProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const history = useHistory();
  const location = useLocation();
  const [platform, setPlatform] = useState<MarketPlatform>(
    () =>
      getPlatformFromPath(location.pathname) ??
      getPlatformFromSearch(location.search) ??
      DEFAULT_PLATFORM,
  );

  useEffect(() => {
    const locationPlatform = getPlatformFromPath(location.pathname);
    if (locationPlatform) {
      if (locationPlatform !== platform) setPlatform(locationPlatform);
      return;
    }
    const legacyPlatform = getPlatformFromSearch(location.search);
    if (legacyPlatform && legacyPlatform !== platform) {
      setPlatform(legacyPlatform);
    }
  }, [location.pathname, location.search, platform]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("eso-market-platform", platform);
    }
  }, [platform]);

  const updatePlatform = useCallback(
    (nextPlatform: MarketPlatform) => {
      const normalizedPlatform = isMarketPlatform(nextPlatform)
        ? nextPlatform
        : DEFAULT_PLATFORM;

      setPlatform(normalizedPlatform);

      history.push({
        pathname: setPlatformInPath(location.pathname, normalizedPlatform),
        search: removePlatformFromSearch(location.search),
      });
    },
    [history, location],
  );

  return (
    <PlatformContext.Provider value={{ platform, setPlatform: updatePlatform }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => useContext(PlatformContext);
