import { useLazyQuery } from '@apollo/client'
import { useEffect } from 'react'
import { InView } from 'react-intersection-observer'
import { useLocation, useParams } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import { TradableItemCategoryReferenceType } from '../models/tradable-item-types'
import TradableItemList from '../components/TradableItemList'
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'
import * as queries from '../models/queries'
import * as constants from '../constants'

const LIMIT = 20

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
)

const ERROR_STATE = (
  <div className="page-container-content-header-negative-spacer">
    <LoadingSkeleton error={true} />
  </div>
)

export default () => {
  const { state } = useLocation<{
    categoryReference: TradableItemCategoryReferenceType
  }>()
  const { slug } = useParams<{ slug: string }>()

  const categoryReference = state?.categoryReference

  const [getCategoryItems, { loading, error, data, fetchMore }] = useLazyQuery(
    queries.GET_CATEGORY_ITEMS,
    { variables: { categorySlug: slug, offset: 0, limit: LIMIT } }
  )

  useEffect(() => {
    void getCategoryItems({
      variables: { categorySlug: slug, offset: 0, limit: LIMIT },
    })
  }, [slug])

  const loadMoreData = async (isInView: boolean) => {
    isInView &&
      (await fetchMore({
        variables: { offset: data.tradableItems.length, limit: LIMIT },
      }))
  }

  const pageTitle =
    (categoryReference && categoryReference.displayLabel) || slug

  return (
    <PageContainer
      pageTitle={pageTitle}
      metaTitle={constants.getFullPageTitle(
        categoryReference ? categoryReference.displayLabel : slug
      )}
      metaDescription={`View sales information for the category "${
        categoryReference ? categoryReference.displayLabel : slug
      }".`}
    >
      {loading && LOADING_STATE}
      {error && ERROR_STATE}
      {data && data.tradableItems.length && (
        <div>
          <TradableItemList items={data.tradableItems} />
          <InView onChange={loadMoreData} />
        </div>
      )}

      {data && !data.tradableItems.length && (
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
  )
}
