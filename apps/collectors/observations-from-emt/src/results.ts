import { getBaseItemAndTraitFromItem, Item, ItemMeta, legacyNaming, qualityLookup, } from '@eso-market-tracker/eso'
import * as db from '@eso-market-tracker/data'
import { orThrow } from '@eso-market-tracker/logging'

const makeQuery = async (query: string) => {
  const endpoint = 'https://api.esomarkettracker.com/graphql/'
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: null }),
  })

  return await r.json()
}

type EMTStat = {
  date: string

  commonUnitPriceRangeLower: number | null
  commonUnitPriceRangeUpper: number | null

  averageUnitPrice: number | null
  minimumUnitPrice: number | null
  medianUnitPrice: number | null
  maximumUnitPrice: number | null

  commonQuantity: number | null

  totalSales: number
  recentSales: number
  totalUnitsSold: number

  whiteAverageUnitPrice: number | null
  greenAverageUnitPrice: number | null
  blueAverageUnitPrice: number | null
  purpleAverageUnitPrice: number | null
  goldAverageUnitPrice: number | null

  numberOfQualitiesTracked: number
}

type EMTItem = {
  label: string
  slug: string
  currentXboxStats: EMTStat
  historicalXboxStats: EMTStat[]
  name: string
  db: ItemMeta
  trait: number | null
}

const getHistoricalItemData = async (slug: string) => {
  const payload = `query {
    data: tradableItem(slug: "${slug}") {
      label
      displayLabel
      slug
      historicalXboxStats {
        date
        commonUnitPriceRangeLower
        commonUnitPriceRangeUpper
        averageUnitPrice
        minimumUnitPrice
        medianUnitPrice
        maximumUnitPrice
        commonQuantity
        totalSales
        recentSales
        totalUnitsSold
        whiteAverageUnitPrice
        greenAverageUnitPrice
        blueAverageUnitPrice
        purpleAverageUnitPrice
        goldAverageUnitPrice
        numberOfQualitiesTracked
      }
    }
  }`

  return (await makeQuery(payload)).data.data.historicalXboxStats
}

const findItemByNameWithTraitFallback = (name: string) => {
  const legacyName = legacyNaming.internalToName(name)
  const item = db.findItemByName(legacyName)
  if (item) {
    return [item, null]
  }

  const [backupItemName, trait] = getBaseItemAndTraitFromItem(name)
  return [db.findItemByName(backupItemName || 'blah'), trait]
}

const getPageResults = async (offset: number, limit: number) => {
  const payload = `query {
    data: tradableItems(offset:${offset}, limit: ${limit}) {
      label
      displayLabel
      slug
      currentXboxStats {
        date
        commonUnitPriceRangeLower
        commonUnitPriceRangeUpper
        averageUnitPrice
        minimumUnitPrice
        medianUnitPrice
        maximumUnitPrice
        commonQuantity
        totalSales
        recentSales
        totalUnitsSold
        whiteAverageUnitPrice
        greenAverageUnitPrice
        blueAverageUnitPrice
        purpleAverageUnitPrice
        goldAverageUnitPrice
        numberOfQualitiesTracked
      }
    }
  }`

  return Promise.all(
    (await makeQuery(payload)).data.data
      .map((i: EMTItem) => ({
        ...i,
        name: legacyNaming.internalToName(i.label),
      }))
      .filter((i: EMTItem) => i.name != 'a savage ring')
      .map(async (i: EMTItem) => {
        const [item, trait] = findItemByNameWithTraitFallback(i.name)
        return {
          ...i,
          db:
            item ||
            orThrow(new Error(`No database object for ${JSON.stringify(i)}`)),
          trait,
          historicalXboxStats: await getHistoricalItemData(i.slug),
        }
      })
  )
}

const isDefined = <T>(value: T | null | undefined): value is T => value != null

/**
 * For each item, we want to log an entry without quality, and then we want to
 *  log a result for each available quality. If the item has a trait, we want
 *  to log these results under the root item, not the canonical item.
 */
const getObservationsFromResults = (pageResults: EMTItem[]) => {
  return pageResults.flatMap((k) =>
    k.historicalXboxStats.flatMap((i) =>
      qualityLookup
        .map((qualityLabel, index) => {
          const item = Item.from(k.db, {
            quality: index || null,
            trait: k.trait || null,
          })

          // Get our average unit price key such as `whiteAverageUnitPrice` or
          //  generically `averageUnitPrice`
          const key = `${qualityLabel || ''}AverageUnitPrice`.replace(
            /^./,
            (c) => c.toLowerCase()
          ) as
            | 'averageUnitPrice'
            | 'whiteAverageUnitPrice'
            | 'greenAverageUnitPrice'
            | 'blueAverageUnitPrice'
            | 'purpleAverageUnitPrice'
            | 'goldAverageUnitPrice'
          const average = i[key]
          return average
            ? {
                item,
                stats: {
                  average,
                  date: i.date,
                  commonQuantity: i.commonQuantity,
                  minimum: i.minimumUnitPrice,
                  maximum: i.maximumUnitPrice,
                },
              }
            : null
        })
        // If we don't have a price for a given quality, simply ignore it.
        .filter(isDefined)
    )
  )
}

/**
 * The parsed results of a batch of EMT data.
 */
export type Results = ReturnType<(typeof Results)['from']>
export const Results = {
  from: async (offset: number, options?: { limit: number }) => {
    const limit = options?.limit || 10
    const pageResults = await getPageResults(offset, limit)
    const observations = getObservationsFromResults(pageResults)

    return {
      pageResults,
      observations,
      next: pageResults.length ? [offset + limit, limit] : null,
    }
  },
}
