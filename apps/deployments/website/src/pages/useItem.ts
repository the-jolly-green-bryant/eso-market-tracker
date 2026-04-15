import { useEffect, useState } from 'react'
import {
  SalesRollupType,
  TradableItemType,
} from '../models/tradable-item-types'
import { CATEGORIES } from '../constants'

export const getIdFromName = (name: string): number => {
  name = name.toLowerCase().replace(/[^a-z0-9 ]/gi, '')
  let hash = 0x811c9dc5

  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }

  return hash >>> 0
}

/**
 * The expected format for an API response from data.esomarkettracker.com
 */
export type APIItemResponse = {
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
}

type APIResponse = {
  results: APIItemResponse[]
}

type GitResponse = {
  average: number
  date: string
  commonQuantity: number
  minimum: number
  maximum: number
}

export const _responseToHistory = (json: GitResponse[]) =>
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
  })) as SalesRollupType[]

export const _responseToItem = (json: APIItemResponse): TradableItemType => {
  console.log('json', json)
  const platformRaw = json.pricing['xbox-na']

  if (!platformRaw) {
    throw new Error(`${json.item.name} has no pricing data`)
  }

  const baseRaw = platformRaw['--']['--']
  const itemRaw = json.item

  return {
    raw: platformRaw,
    currentXboxStats: {
      averageUnitPrice: baseRaw.average,
      commonQuantity: baseRaw.commonQuantity,
      numberOfQualitiesTracked: Object.keys(platformRaw['--']).filter(
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
      whiteAverageUnitPrice:
        platformRaw['--']['01'] && platformRaw['--']['01'].average,
      greenAverageUnitPrice:
        platformRaw['--']['02'] && platformRaw['--']['02'].average,
      blueAverageUnitPrice:
        platformRaw['--']['03'] && platformRaw['--']['03'].average,
      purpleAverageUnitPrice:
        platformRaw['--']['04'] && platformRaw['--']['04'].average,
      goldAverageUnitPrice:
        platformRaw['--']['05'] && platformRaw['--']['05'].average,
    },
    description: itemRaw.description,
    displayLabel: itemRaw.name,
    slug: itemRaw.name.replace(' ', '-'),
    imageLink:
      itemRaw.icon && itemRaw.icon.startsWith('https')
        ? itemRaw.icon
        : `https://github.com/the-jolly-green-bryant/eso-market-tracker/blob/main/${itemRaw.icon}?raw=true`,
  }
}

export const __useCategory = (category: keyof typeof CATEGORIES) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<TradableItemType[] | null>(null)

  useEffect(() => {
    if (!category || !CATEGORIES[category]) {
      setLoading(false)
      setError(null)
      setData(null)
      return
    }

    const controller = new AbortController()

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const items = await Promise.all(
          CATEGORIES[category].map(async (name) => {
            const internalId = getIdFromName(name)
            const r = await fetch(
              `https://data.esomarkettracker.com/item/${internalId}`,
              { signal: controller.signal }
            )

            if (!r.ok) {
              throw new Error(`Request failed: ${r.status}`)
            }

            const raw = ((await r.json()) as APIResponse).results?.[0]
            return raw ? _responseToItem(raw) : null
          })
        )

        setData(items.filter(Boolean) as TradableItemType[])
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        setError(e as Error)
        setData(null)
        throw e
      } finally {
        setLoading(false)
      }
    }

    void load()

    return () => controller.abort()
  }, [category])

  return { loading, error, data }
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

      const json = _responseToItem(
        ((await r.json()) as APIResponse).results.at(0)!
      )
      setData(json)
      setLoading(false)
    }

    void load()
    return () => controller.abort()
  }, [slug])

  return { loading, error, data }
}

export const __useSearch = (text: string) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<TradableItemType[]>([])

  useEffect(() => {
    if (!text) {
      setLoading(false)
      setData([])
      return
    }

    const controller = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const r = await fetch(
          `https://data.esomarkettracker.com/search/${text}`,
          { signal: controller.signal }
        )

        if (!r.ok) {
          throw new Error(`Request failed: ${r.status}`)
        }

        const raw = (await r.json()) as APIResponse
        const json = raw.results
          .filter((i) => i.pricing['xbox-na'])
          .map(_responseToItem)
        setData(json)
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        setError(e as Error)
        throw e
      } finally {
        setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [text])

  return { loading, error, data }
}

export const __useItemHistory = (slug: string) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<SalesRollupType[] | null>(null)

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

      const json = _responseToHistory(await r.json())
      setData(json)
      setLoading(false)
    }

    void load()
    return () => controller.abort()
  }, [slug])

  return { loading, error, data }
}
