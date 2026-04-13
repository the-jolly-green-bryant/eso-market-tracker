import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import TradableItemList from '../components/TradableItemList'
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'
import * as constants from '../constants'
import { __useCategory } from './useItem'

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
  const { slug } = useParams<{ slug: string }>()
  const { loading, error, data } = __useCategory(slug)

  const pageTitle = slug

  return (
    <PageContainer
      pageTitle={pageTitle}
      metaTitle={constants.getFullPageTitle(slug)}
      metaDescription={`View sales information for the category "slug".`}
    >
      {loading && LOADING_STATE}
      {error && ERROR_STATE}
      {data && data.length && (
        <div>
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
  )
}
