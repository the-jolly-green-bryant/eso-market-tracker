import { useEffect, useState } from 'react'
import { TradableItemType } from '../models/tradable-item-types'

export const getIdFromName = (name: string): number => {
  name = name.toLowerCase().replace(/[^a-z0-9 ]/gi, '')
  let hash = 0x811c9dc5

  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

type APIResponse = {
  results: {
    pricing: {
      'xbox-na': {
        [trait: string]: {
          [quality: string]: {
            average: number
            date: string
            commonQuantity: number
            minimum: number
            maximum: number
          }
        }
      }
    }
    item: {
      internalId: number
      name: string
      description: string
      icon: string
    }
  }[]
}

type GitResponse = {
  average: number
  date: string
  commonQuantity: number
  minimum: number
  maximum: number
}

const _responseToHistory = (json: GitResponse[]) =>
  Object.values(json).map((i) => ({
    averageUnitPrice: i.average,
    commonQuantity: i.commonQuantity,
    commonUnitPriceRangeLower: i.minimum,
    commonUnitPriceRangeUpper: i.maximum,
    date: i.date,
    maximumUnitPrice: i.maximum,
    minimumUnitPrice: i.minimum,
    totalSales: 1,
    recentSales: 1,
    totalUnitsSold: 1,
    medianUnitPrice: (i.minimum + i.maximum) / 2,
  }))

const _responseToItem = (json: APIResponse) => {
  const xboxRaw = json.results.at(0)!.pricing['xbox-na']
  const baseRaw = xboxRaw['--']['--']
  const itemRaw = json.results.at(0)!.item

  return {
    category: {}, // TODO
    currentXboxStats: {
      averageUnitPrice: baseRaw.average,
      commonQuantity: baseRaw.commonQuantity,
      numberOfQualitiesTracked: Object.keys(xboxRaw['--']).filter(
        (i) => i != '--'
      ).length,
      commonUnitPriceRangeLower: baseRaw.minimum,
      commonUnitPriceRangeUpper: baseRaw.maximum,
      date: baseRaw.date,
      maximumUnitPrice: baseRaw.maximum,
      minimumUnitPrice: baseRaw.minimum,
      totalSales: 1,
      recentSales: 1,
      totalUnitsSold: 1,
      medianUnitPrice: (baseRaw.minimum + baseRaw.maximum) / 2,
      whiteAverageUnitPrice: xboxRaw['--']['01'] && xboxRaw['--']['01'].average,
      greenAverageUnitPrice: xboxRaw['--']['02'] && xboxRaw['--']['02'].average,
      blueAverageUnitPrice: xboxRaw['--']['03'] && xboxRaw['--']['03'].average,
      purpleAverageUnitPrice:
        xboxRaw['--']['04'] && xboxRaw['--']['04'].average,
      goldAverageUnitPrice: xboxRaw['--']['05'] && xboxRaw['--']['05'].average,
    },
    description: itemRaw.description,
    displayLabel: itemRaw.name,
    imageLink: `https://github.com/the-jolly-green-bryant/eso-market-tracker/blob/main/${itemRaw.icon}?raw=true`,
  }
}

export const __useItem = (slug: string) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<TradableItemType | null>(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setData(null)
      return
    }

    const controller = new AbortController()
    const internalId = getIdFromName(slug.replaceAll('-', ' '))

    const load = async () => {
      setLoading(true)
      setError(null)

      const r = await fetch(
        `https://data.esomarkettracker.com/item/${internalId}`,
        { signal: controller.signal }
      )

      if (!r.ok) {
        throw new Error(`Request failed: ${r.status}`)
      }

      const json = _responseToItem(await r.json())
      console.log('json', json)
      setData(json)
      setLoading(false)
    }

    void load()
    return () => controller.abort()
  }, [slug])

  return { loading, error, data }
}

export const __useItemHistory = (slug: string) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<TradableItemType | null>(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setData(null)
      return
    }

    const controller = new AbortController()
    const internalId = getIdFromName(slug.replaceAll('-', ' '))

    const load = async () => {
      setLoading(true)
      setError(null)

      const historicalUrl = internalId
        .toString()
        .padStart(6, '0')
        .split('')
        .reverse()
        .join('')
        .substring(0, 6)
        .replace(
          /^(.{2})(.{2})(.{2})/,
          `https://raw.githubusercontent.com/the-jolly-green-bryant/eso-market-tracker/refs/heads/main/data/items/$1/$2/$3/${internalId}------.xbox-na.historical.json`
        )
      const r = await fetch(historicalUrl, { signal: controller.signal })

      if (!r.ok) {
        throw new Error(`Request failed: ${r.status}`)
      }

      const json = await _responseToHistory(await r.json())
      setData(json)
      setLoading(false)
    }

    void load()
    return () => controller.abort()
  }, [slug])

  return { loading, error, data }
}
