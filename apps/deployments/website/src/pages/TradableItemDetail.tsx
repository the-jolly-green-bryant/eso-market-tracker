import { useLocation, useParams } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import TradableItem from '../components/TradableItem'
import TradableItemSkeleton from '../components/TradableItemSkeleton'
import { TradableItemReferenceType } from '../models/tradable-item-types'
import * as constants from '../constants'
import { __useItem, __useItemHistory } from './useItem'

const TradableItemDetail: React.FC = () => {
  const { state } = useLocation<{ itemReference: TradableItemReferenceType }>()
  const { slug } = useParams<{ slug: string }>()

  const itemReference: TradableItemReferenceType = state?.itemReference
  const { loading, error, data } = __useItem(slug)
  const { data: historicalData } = __useItemHistory(slug)

  const pageTitle: string =
    (data && data.displayLabel) || (itemReference && itemReference.displayLabel)

  return (
    <PageContainer
      pageTitle={pageTitle}
      bleedsIntoHeader={true}
      metaTitle={constants.getFullPageTitle(
        (data && data.displayLabel) ||
          (itemReference && itemReference.displayLabel) ||
          slug
      )}
      metaDescription={`View sales information for the item "${
        (data && data.displayLabel) ||
        (itemReference && itemReference.displayLabel) ||
        slug
      }". ${
        data &&
        `Average sale price: ${Math.round(
          data.currentXboxStats.averageUnitPrice
        ).toLocaleString()}`
      }`}
    >
      {loading && <TradableItemSkeleton />}

      {error && <LoadingSkeleton error={true} />}

      {!error && !loading && data && historicalData && (
        <TradableItem item={{ ...data, historicalXboxStats: historicalData }} />
      )}
    </PageContainer>
  )
}

export default TradableItemDetail
