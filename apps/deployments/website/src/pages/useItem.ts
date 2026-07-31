import { useEffect, useState } from "react";
import {
  SalesRollupType,
  TradableItemType,
  VariantPricingType,
} from "../models/tradable-item-types";
import { CATEGORIES } from "../constants";
import { getItemVariantStats } from "../item-variants";
import { MarketPlatform, usePlatform } from "../platform";
import { strFromU8, unzipSync } from "fflate";

export const getIdFromName = (name: string): number => {
  name = name.toLowerCase().replace(/[^a-z0-9 ]/gi, "");
  let hash = 0x811c9dc5;

  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
};

/**
 * The expected format for an API response from data.esomarkettracker.com
 */
export type APIItemResponse = {
  pricing: Partial<Record<MarketPlatform, VariantPricingType>>;
  item: {
    internalId: number;
    name: string;
    description: string;
    icon: string;
  };
};

type APIResponse = {
  results: APIItemResponse[];
};

type GitResponse = {
  average: number;
  date: string;
  commonQuantity: number;
  minimum: number;
  maximum: number;
};

export const _responseToHistory = (json: GitResponse[]) =>
  Object.values(json)
    .map((i) => ({
      averageUnitPrice: i.average,
      commonQuantity: i.commonQuantity,
      commonUnitPriceRangeLower: i.minimum,
      commonUnitPriceRangeUpper: i.maximum,
      date: i.date,
      maximumUnitPrice: i.maximum,
      minimumUnitPrice: i.minimum,
      medianUnitPrice: (i.minimum + i.maximum) / 2,
    }))
    .sort((a, b) => a.date.localeCompare(b.date)) as SalesRollupType[];

export const _responseToItem = (
  json: APIItemResponse,
  platform: MarketPlatform = "xbox-na",
): TradableItemType => {
  const platformRaw = json.pricing[platform];

  if (!platformRaw) {
    throw new Error(`${json.item.name} has no pricing data`);
  }

  const traitId = platformRaw["--"] ? "--" : Object.keys(platformRaw).at(0);
  const safeTrait = traitId ? platformRaw[traitId] : undefined;
  const qualityId = safeTrait?.["--"]
    ? "--"
    : Object.keys(safeTrait ?? {}).at(0);
  const currentStats =
    traitId && qualityId
      ? getItemVariantStats(platformRaw, traitId, qualityId)
      : null;

  if (!currentStats) {
    throw new Error(`${json.item.name} has no pricing data`);
  }
  const itemRaw = json.item;

  return {
    raw: platformRaw,
    currentXboxStats: currentStats,
    description: itemRaw.description,
    displayLabel: itemRaw.name,
    slug: itemRaw.name.replace(" ", "-"),
    imageLink:
      itemRaw.icon && itemRaw.icon.startsWith("https")
        ? itemRaw.icon
        : `https://github.com/the-jolly-green-bryant/eso-market-tracker/blob/main/${itemRaw.icon}?raw=true`,
    platform,
    availablePlatforms: Object.keys(json.pricing),
  };
};

export const __useCategory = (category: keyof typeof CATEGORIES) => {
  const { platform } = usePlatform();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TradableItemType[] | null>(null);

  useEffect(() => {
    if (!category || !CATEGORIES[category]) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const items = await Promise.all(
          CATEGORIES[category].map(async (name) => {
            const internalId = getIdFromName(name);
            const r = await fetch(
              `https://data.esomarkettracker.com/item/${internalId}`,
              { signal: controller.signal },
            );

            if (!r.ok) {
              throw new Error(`Request failed: ${r.status}`);
            }

            const raw = ((await r.json()) as APIResponse).results?.[0];
            return raw?.pricing[platform]
              ? _responseToItem(raw, platform)
              : null;
          }),
        );

        setData(items.filter(Boolean) as TradableItemType[]);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e as Error);
        setData(null);
        throw e;
      } finally {
        setLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [category, platform]);

  return { loading, error, data };
};

export const __useItem = (slug: string) => {
  const { platform } = usePlatform();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TradableItemType | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setData(null);
      return;
    }

    const controller = new AbortController();
    const internalId = getIdFromName(slug.replaceAll("-", " "));

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const r = await fetch(
          `https://data.esomarkettracker.com/item/${internalId}`,
          { signal: controller.signal },
        );

        if (!r.ok) {
          throw new Error(`Request failed: ${r.status}`);
        }

        const response = ((await r.json()) as APIResponse).results.at(0)!;
        setData(_responseToItem(response, platform));
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e as Error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [slug, platform]);

  return { loading, error, data };
};

export const __useSearch = (text: string) => {
  const { platform } = usePlatform();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TradableItemType[]>([]);

  useEffect(() => {
    if (!text) {
      setLoading(false);
      setData([]);
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const r = await fetch(
          `https://data.esomarkettracker.com/search/${text}`,
          { signal: controller.signal },
        );

        if (!r.ok) {
          throw new Error(`Request failed: ${r.status}`);
        }

        const raw = (await r.json()) as APIResponse;
        const json = raw.results
          .filter((i) => i.pricing[platform])
          .map((item) => _responseToItem(item, platform));
        setData(json);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [text, platform]);

  return { loading, error, data };
};

/**
 * Archive entry for one item's platform, trait, and quality history.
 */
export const getItemHistoryEntryName = (
  internalId: number,
  platform: MarketPlatform,
  traitId = "--",
  qualityId = "--",
) => `${internalId}-${traitId}-${qualityId}.${platform}.historical.json`;

const getItemDirectoryUrl = (internalId: number) =>
  internalId
    .toString()
    .padStart(6, "0")
    .split("")
    .reverse()
    .join("")
    .substring(0, 6)
    .replace(
      /^(.{2})(.{2})(.{2})/,
      `https://raw.githubusercontent.com/the-jolly-green-bryant/eso-market-data/refs/heads/main/items/$1/$2/$3`,
    );

const fetchItemHistory = async ({
  internalId,
  platform,
  qualityId,
  signal,
  traitId,
}: {
  internalId: number;
  platform: MarketPlatform;
  qualityId: string;
  signal: AbortSignal;
  traitId: string;
}) => {
  const itemDirectoryUrl = getItemDirectoryUrl(internalId);
  const entryName = getItemHistoryEntryName(
    internalId,
    platform,
    traitId,
    qualityId,
  );
  const archiveResponse = await fetch(
    `${itemDirectoryUrl}/${internalId}.pricing.zip`,
    { signal },
  );

  if (archiveResponse.ok) {
    const entries = unzipSync(
      new Uint8Array(await archiveResponse.arrayBuffer()),
      { filter: ({ name }) => name === entryName },
    );
    const history = entries[entryName];
    return history ? _responseToHistory(JSON.parse(strFromU8(history))) : [];
  }

  // Keep old deployments readable while compressed archives propagate.
  const legacyResponse = await fetch(`${itemDirectoryUrl}/${entryName}`, {
    signal,
  });
  return legacyResponse.ok
    ? _responseToHistory(await legacyResponse.json())
    : [];
};

export const __useItemHistory = (
  slug: string,
  traitId = "--",
  qualityId = "--",
) => {
  const { platform } = usePlatform();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<SalesRollupType[] | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const requestKey = `${slug}:${platform}:${traitId}:${qualityId}`;

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setData(null);
      return;
    }

    const controller = new AbortController();
    const internalId = getIdFromName(slug.replaceAll("-", " "));

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const history = await fetchItemHistory({
          internalId,
          platform,
          qualityId,
          traitId,
          signal: controller.signal,
        });
        setData(history);
        setLoadedKey(requestKey);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e as Error);
        setData([]);
        setLoadedKey(requestKey);
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [slug, platform, traitId, qualityId, requestKey]);

  return {
    loading,
    error,
    data: loadedKey === requestKey ? data : null,
  };
};
