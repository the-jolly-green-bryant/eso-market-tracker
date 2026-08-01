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

export const setPlatformInSearch = (
  search: string,
  platform: MarketPlatform,
) => {
  const params = new URLSearchParams(search);
  params.set("platform", platform);
  return `?${params.toString()}`;
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
    () => getPlatformFromSearch(location.search) ?? DEFAULT_PLATFORM,
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasRequestedPlatform = params.has("platform");
    const locationPlatform = getPlatformFromSearch(location.search);

    if (locationPlatform) {
      if (locationPlatform !== platform) setPlatform(locationPlatform);
      return;
    }

    const nextPlatform = hasRequestedPlatform ? DEFAULT_PLATFORM : platform;
    if (nextPlatform !== platform) setPlatform(nextPlatform);

    history.replace({
      ...location,
      search: setPlatformInSearch(location.search, nextPlatform),
    });
  }, [history, location, platform]);

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

      const nextSearch = setPlatformInSearch(
        location.search,
        normalizedPlatform,
      );
      if (nextSearch === location.search) return;

      history.push({
        ...location,
        search: nextSearch,
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
