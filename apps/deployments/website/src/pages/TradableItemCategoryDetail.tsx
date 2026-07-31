import { useParams } from "react-router-dom";

import LoadingSkeleton from "../components/LoadingSkeleton";
import PageContainer from "../components/PageContainer";
import TradableItemList from "../components/TradableItemList";
import TradableItemReferenceSkeleton from "../components/TradableItemReferenceSkeleton";
import * as constants from "../constants";
import { CATEGORIES } from "../constants";
import { __useCategory } from "./useItem";
import { TradableItemType } from "../models/tradable-item-types";
import { useEffect } from "react";
import { trackCategoryView } from "../analytics";

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

export default ({ staticData }: CategoryProps) => {
  const { slug } = staticData ?? useParams<{ slug: keyof typeof CATEGORIES }>();
  const { loading, error, data } = staticData ?? __useCategory(slug);

  useEffect(() => {
    if (data) trackCategoryView(slug, data.length);
  }, [slug, data]);

  return (
    <PageContainer
      pageTitle={slug}
      metaTitle={`${slug} ESO Prices | ESO Market Tracker`}
      metaDescription={`Compare current ESO console prices and market information for ${slug}, including Xbox and PlayStation market values.`}
      canonicalPath={`${constants.CATEGORY_PATH}/${slug}`}
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
