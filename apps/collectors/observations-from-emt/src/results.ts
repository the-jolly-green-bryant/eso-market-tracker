import { legacyNaming } from '@eso-market-tracker/eso'
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
  currentXboxStats: EMTStat
  name: string
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

  return (await makeQuery(payload)).data.data
    .map((i: EMTItem) => ({
      ...i,
      name: legacyNaming.internalToName(i.label),
    }))
    .map((i: EMTItem) => {
      return {
        ...i,
        db:
          db.findItemByName(i.name) ||
          orThrow(new Error(`No database object for ${JSON.stringify(i)}`)),
      }
    })
}

/**
 * The parsed results of a batch of EMT data.
 */
export type Results = ReturnType<(typeof Results)['from']>
export const Results = {
  from: async (offset: number, options?: { limit: number }) => {
    const limit = options?.limit || 10
    const pageResults = await getPageResults(offset, limit)

    return {
      pageResults,
    }
  },
}
