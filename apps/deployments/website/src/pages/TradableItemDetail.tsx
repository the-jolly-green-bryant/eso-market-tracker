import { useLocation, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet'

import LoadingSkeleton from '../components/LoadingSkeleton'
import MarketHeader from '../components/MarketHeader'
import MarketItemDetail from '../components/MarketItemDetail'
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

      {!error && !loading && data && historicalData && (
        <MarketItemDetail item={data} history={historicalData} />
      )}
    </>
  )
}

export default TradableItemDetail
