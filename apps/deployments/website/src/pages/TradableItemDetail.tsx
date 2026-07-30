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
import * as routes from '../routes'
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

// eslint-disable-next-line max-lines-per-function
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
  const itemName = pageTitle || slug
  const averagePrice = data
    ? Math.round(data.currentXboxStats.averageUnitPrice)
    : undefined
  const canonicalPath = `${routes.item()}/${itemName}`
  const metaTitle = `${itemName} Price Check & Market Value | ESO Market Tracker`
  const metaDescription = averagePrice
    ? `Check the current ${itemName} price in ESO. Average console sale price: ${averagePrice.toLocaleString()} gold, with recent range and sales history.`
    : `Check the current ${itemName} price, market value, recent sales, and console trading history in The Elder Scrolls Online.`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${itemName} ESO Price Check`,
        url: `https://esomarkettracker.com${encodeURI(canonicalPath)}`,
        description: metaDescription,
        about: {
          '@type': 'Thing',
          name: itemName,
          description: data?.description,
        },
        isPartOf: {
          '@type': 'WebSite',
          name: constants.SITE_TITLE,
          url: 'https://esomarkettracker.com/',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'ESO Price Checker',
            item: 'https://esomarkettracker.com/dashboard/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: itemName,
            item: `https://esomarkettracker.com${encodeURI(canonicalPath)}`,
          },
        ],
      },
    ],
  }

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
      metaTitle={metaTitle}
      metaDescription={metaDescription}
      canonicalPath={canonicalPath}
      jsonLd={jsonLd}
    >
      {loading && <TradableItemSkeleton />}

      {error && <LoadingSkeleton error={true} />}

      {!error && !loading && data && historicalData && (
        <>
          <TradableItem
            item={{ ...data, historicalXboxStats: historicalData }}
          />
          <section className="item-seo-summary">
            <h2>{itemName} ESO price check</h2>
            <p>
              The current average console market value for {itemName} is{' '}
              <strong>{averagePrice?.toLocaleString()} gold</strong>. Use the
              price range and sales history above to compare guild trader
              values before you buy or list this item.
            </p>
            <p>
              ESO Market Tracker is a public Elder Scrolls Online price checker
              covering Xbox and PlayStation markets with regularly refreshed,
              versioned data.
            </p>
          </section>
        </>
      )}
    </PageContainer>
  )
}

export default TradableItemDetail
