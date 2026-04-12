import { useQuery } from '@apollo/client'
import { useLocation, useParams } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import TradableItem from '../components/TradableItem'
import TradableItemSkeleton from '../components/TradableItemSkeleton'
import { TradableItemReferenceType } from '../models/tradable-item-types'
import * as queries from '../models/queries'
import * as constants from '../constants'

const TradableItemDetail: React.FC = () => {
  const { state } = useLocation<{
    itemReference: TradableItemReferenceType
  }>()
  const { slug } = useParams<{ slug: string }>()

  const itemReference: TradableItemReferenceType = state?.itemReference

  const { loading, error, data } = useQuery(queries.GET_ITEM, {
    variables: { slug },
  })

  const pageTitle: string =
    (data && data.tradableItem.displayLabel) ||
    (itemReference && itemReference.displayLabel) ||
    null

  return (
    <PageContainer
      pageTitle={pageTitle}
      bleedsIntoHeader={true}
      metaTitle={constants.getFullPageTitle(
        (data && data.tradableItem.displayLabel) ||
          (itemReference && itemReference.displayLabel) ||
          slug
      )}
      metaDescription={`View sales information for the item "${
        (data && data.tradableItem.displayLabel) ||
        (itemReference && itemReference.displayLabel) ||
        slug
      }". ${
        data &&
        `Average sale price: ${Math.round(
          data.tradableItem.currentXboxStats.averageUnitPrice
        ).toLocaleString()}`
      }`}
      shareLink={constants.getShareLink(slug)}
    >
      {loading && <TradableItemSkeleton />}

      {error && <LoadingSkeleton error={true} />}

      {!error && !loading && <TradableItem item={data.tradableItem} />}
    </PageContainer>
  )
}

export default TradableItemDetail
