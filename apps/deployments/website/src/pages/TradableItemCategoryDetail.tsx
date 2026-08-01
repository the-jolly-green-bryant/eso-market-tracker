import { useParams } from "react-router-dom";

import LoadingSkeleton from "../components/LoadingSkeleton";
import PageContainer from "../components/PageContainer";
import TradableItemList from "../components/TradableItemList";
import TradableItemReferenceSkeleton from "../components/TradableItemReferenceSkeleton";
import { CATEGORIES } from "../constants";
import { __useCategory } from "./useItem";
import { TradableItemType } from "../models/tradable-item-types";
import { useEffect } from "react";
import { trackCategoryView } from "../analytics";
import { PLATFORMS, usePlatform } from "../platform";
import * as routes from "../routes";

const LOADING_STATE = (
  <div>
    <LoadingSkeleton error={false}>
      <div>
        <TradableItemReferenceSkeleton />
        <TradableItemReferenceSkeleton />
        <TradableItemReferenceSkeleton />
      </div>
    </LoadingSkeleton>
  </div>
);

const ERROR_STATE = (
  <div className="page-container-content-header-negative-spacer">
    <LoadingSkeleton error={true} />
  </div>
);

/**
 * Structure of data for static rendering of category pages.
 */
export type CategoryProps = {
  staticData?: {
    data: TradableItemType[];
    slug: keyof typeof CATEGORIES;
    error?: string;
    loading?: string;
  };
};

// eslint-disable-next-line max-lines-per-function
export default ({ staticData }: CategoryProps) => {
  const { platform } = usePlatform();
  const platformLabel = PLATFORMS[platform];
  const { slug } = staticData ?? useParams<{ slug: keyof typeof CATEGORIES }>();
  const { loading, error, data } = staticData ?? __useCategory(slug);

  useEffect(() => {
    if (data) trackCategoryView(slug, data.length);
  }, [slug, data]);

  return (
    <PageContainer
      pageTitle={slug}
      metaTitle={`${slug} Prices for ${platformLabel} in ESO | ESO Market Tracker`}
      metaDescription={`Compare current Elder Scrolls Online prices for ${slug} on ${platformLabel}, including recent market values and pricing data.`}
      canonicalPath={routes.getCategory(slug, platform)}
      jsonLd={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CollectionPage",
            name: `${slug} Prices in ESO`,
            url: `https://esomarkettracker.com${encodeURI(
              routes.getCategory(slug, platform),
            )}`,
            description: `Current Elder Scrolls Online market prices for ${slug} on ${platformLabel}.`,
            mainEntity: data
              ? {
                  "@type": "ItemList",
                  numberOfItems: data.length,
                  itemListElement: data.map((item, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: item.displayLabel,
                    url: `https://esomarkettracker.com${encodeURI(
                      routes.getItem(item.displayLabel, platform),
                    )}`,
                  })),
                }
              : undefined,
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "ESO Market Categories",
                item: `https://esomarkettracker.com${routes.getCategories(platform)}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: slug,
                item: `https://esomarkettracker.com${encodeURI(
                  routes.getCategory(slug, platform),
                )}`,
              },
            ],
          },
        ],
      }}
    >
      {!staticData && loading && LOADING_STATE}
      {!staticData && error && ERROR_STATE}
      {data && data.length > 0 && (
        <div className="market-item-results">
          <TradableItemList items={data} />
        </div>
      )}

      {data && !data.length && (
        <div className="page-container-content-header-negative-spacer">
          <LoadingSkeleton
            error={false}
            loading={false}
            title="No Results!"
            message={`No results could be found. Please try a different search term.`}
          />
        </div>
      )}
    </PageContainer>
  );
};
