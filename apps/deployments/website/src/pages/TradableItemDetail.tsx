import { useLocation, useParams } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import TradableItem from '../components/TradableItem'
import TradableItemSkeleton from '../components/TradableItemSkeleton'
import {
  SalesRollupType,
  TradableItemReferenceType,
  TradableItemType,
} from '../models/tradable-item-types'
import * as constants from '../constants'
import { __useItem, __useItemHistory } from './useItem'
import { useEffect } from 'react'
import { trackItemView } from '../analytics'

/**
 * Structure of data for static rendering of item pages
 */
export type ItemProps = {
  staticData?: {
    data: TradableItemType
    historicalData: SalesRollupType[]
    slug: string
    error?: string
    loading?: string
  }
}

const TradableItemDetail: React.FC<ItemProps> = ({ staticData }) => {
  const { state } = useLocation<{ itemReference: TradableItemReferenceType }>()
  const { slug } = staticData ?? useParams<{ slug: string }>()

  const itemReference: TradableItemReferenceType = state?.itemReference
  const { loading, error, data } = staticData ?? __useItem(slug)
  const historicalData = staticData
    ? staticData.historicalData
    : __useItemHistory(slug).data

  const pageTitle: string =
    (data && data.displayLabel) || (itemReference && itemReference.displayLabel)

  useEffect(() => {
    if (!data) return
    trackItemView({
      slug: data.slug,
      displayLabel: data.displayLabel,
      category: data.category?.displayLabel,
      price: data.currentXboxStats.averageUnitPrice,
    })
  }, [data])

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
