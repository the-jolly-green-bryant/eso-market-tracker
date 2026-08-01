import { useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";

import LoadingSkeleton from "../components/LoadingSkeleton";
import MarketHeader from "../components/MarketHeader";
import MarketItemDetail from "../components/MarketItemDetail";
import TradableItemSkeleton from "../components/TradableItemSkeleton";
import {
  SalesRollupType,
  TradableItemReferenceType,
  TradableItemType,
} from "../models/tradable-item-types";
import * as constants from "../constants";
import * as routes from "../routes";
import { __useItem, __useItemHistory } from "./useItem";
import { useEffect, useMemo, useState } from "react";
import { trackItemView } from "../analytics";
import { getItemVariantOptions } from "../item-variants";
import { PLATFORMS, usePlatform } from "../platform";

/**
 * Structure of data for static rendering of item pages
 */
export type ItemProps = {
  staticData?: {
    data: TradableItemType;
    historicalData: SalesRollupType[];
    slug: string;
    error?: string;
    loading?: string;
  };
};

// eslint-disable-next-line max-lines-per-function
const TradableItemDetail: React.FC<ItemProps> = ({ staticData }) => {
  const { platform } = usePlatform();
  const { state } = useLocation<{ itemReference: TradableItemReferenceType }>();
  const { slug } = staticData ?? useParams<{ slug: string }>();

  const itemReference: TradableItemReferenceType = state?.itemReference;
  const { loading, error, data } = staticData ?? __useItem(slug);
  const [traitId, setTraitId] = useState("--");
  const [qualityId, setQualityId] = useState("--");
  const traitOptions = useMemo(
    () => getItemVariantOptions(data?.raw).traits,
    [data?.raw],
  );
  const selectedTraitId = traitOptions.some(({ id }) => id === traitId)
    ? traitId
    : (traitOptions.at(0)?.id ?? "--");
  const qualityOptions = useMemo(
    () => getItemVariantOptions(data?.raw, selectedTraitId).qualities,
    [data?.raw, selectedTraitId],
  );
  const selectedQualityId = qualityOptions.some(({ id }) => id === qualityId)
    ? qualityId
    : (qualityOptions.at(0)?.id ?? "--");
  const variantHistory = __useItemHistory(
    slug,
    selectedTraitId,
    selectedQualityId,
  ).data;
  const isAggregateVariant =
    selectedTraitId === "--" && selectedQualityId === "--";
  const historicalData =
    (staticData && isAggregateVariant
      ? staticData.historicalData
      : variantHistory) ?? [];

  const pageTitle: string =
    (data && data.displayLabel) ||
    (itemReference && itemReference.displayLabel);
  const itemName = pageTitle || slug;
  const averagePrice = data
    ? Math.round(data.currentXboxStats.averageUnitPrice)
    : undefined;
  const canonicalPath = routes.getItem(itemName, platform);
  const platformLabel = PLATFORMS[platform];
  const metaTitle = `${itemName} Price Check for ${platformLabel} | ESO Market Tracker`;
  const metaDescription = averagePrice
    ? `Check the current ${itemName} price for ${platformLabel} in ESO. Average market price: ${averagePrice.toLocaleString()} gold, with recent range and price history.`
    : `Check the current ${itemName} price, market value, recent range, and ${platformLabel} price history in The Elder Scrolls Online.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${itemName} ESO Price Check`,
        url: `https://esomarkettracker.com${encodeURI(canonicalPath)}`,
        description: metaDescription,
        about: {
          "@type": "Thing",
          name: itemName,
          description: data?.description,
        },
        isPartOf: {
          "@type": "WebSite",
          name: constants.SITE_TITLE,
          url: "https://esomarkettracker.com/",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ESO Price Checker",
            item: `https://esomarkettracker.com${routes.getDashboard(platform)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: itemName,
            item: `https://esomarkettracker.com${encodeURI(canonicalPath)}`,
          },
        ],
      },
    ],
  };

  useEffect(() => {
    if (!data) return;
    trackItemView({
      slug: data.slug,
      displayLabel: data.displayLabel,
      category: data.category?.displayLabel,
      price: data.currentXboxStats.averageUnitPrice,
    });
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const defaultTraits = getItemVariantOptions(data.raw).traits;
    const defaultTraitId =
      defaultTraits.find(({ id }) => id === "--")?.id ??
      defaultTraits.at(0)?.id ??
      "--";
    const defaultQualities = getItemVariantOptions(
      data.raw,
      defaultTraitId,
    ).qualities;
    const defaultQualityId =
      defaultQualities.find(({ id }) => id === "--")?.id ??
      defaultQualities.at(0)?.id ??
      "--";
    setTraitId(defaultTraitId);
    setQualityId(defaultQualityId);
  }, [data]);

  const onTraitChange = (nextTraitId: string) => {
    setTraitId(nextTraitId);
    const nextQualities = getItemVariantOptions(
      data?.raw,
      nextTraitId,
    ).qualities;
    setQualityId((currentQualityId) =>
      nextQualities.some(({ id }) => id === currentQualityId)
        ? currentQualityId
        : (nextQualities.at(0)?.id ?? "--"),
    );
  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link
          rel="canonical"
          href={`https://esomarkettracker.com${encodeURI(canonicalPath)}`}
        />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {loading && (
        <div className="market-item-page">
          <MarketHeader />
          <TradableItemSkeleton />
        </div>
      )}

      {error && (
        <div className="market-item-page">
          <MarketHeader />
          <LoadingSkeleton error={true} />
        </div>
      )}

      {!error && !loading && data && (
        <MarketItemDetail
          item={data}
          history={historicalData}
          onQualityChange={setQualityId}
          onTraitChange={onTraitChange}
          qualities={qualityOptions}
          qualityId={selectedQualityId}
          traits={traitOptions}
          traitId={selectedTraitId}
        />
      )}
    </>
  );
};

export default TradableItemDetail;
