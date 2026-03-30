import 'dotenv/config'
import { LootedResults, MinedResults } from './results'
import { images } from '@eso-market-tracker/database'
import { logger, orThrow } from '@eso-market-tracker/logging'
import pLimit from 'p-limit'
import { insertItems } from '@eso-market-tracker/data'
import { Item } from '@eso-market-tracker/eso'
import * as self from './index'

const getMinedEndpoint = (page: number | null) => {
  page = page ?? 0
  return `https://esolog.uesp.net/viewlog.php?start=${page * 1000}&record=minedItemSummary`
}

const getLootedEndpoint = (page: number | null) => {
  page = page ?? 0
  return `https://esolog.uesp.net/viewlog.php?start=${page * 1000}&record=item`
}

export const getHtmlFromEndpoint = async (
  endpoint: string,
  options?: {
    cookie: string
  }
): Promise<string> => {
  const cookie =
    options?.cookie ||
    process.env.UESP_COOKIE ||
    orThrow(new Error('No UESP_COOKIE env defined'))

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
      cookie,
      referer: 'https://esolog.uesp.net/',
    },
  })

  res.ok || orThrow(new Error(`Failed: ${res.status} ${res.statusText}`))
  return await res.text()
}

const processResultingItems = async (results: Item[]) => {
  const limit = pLimit(10)
  await Promise.all(
    results.map(async (item) =>
      limit(async () => {
        insertItems([item])
        if (!item.meta.icon) return
        logger.info(`Saving image ${item.meta.icon}`)
        item.meta.icon = await images.getOrDownloadImage(item.meta.icon)
      })
    )
  )
}

export const processNextPageOfMinedResults = async (
  lastMinedResults?: MinedResults,
  skipRecursion?: boolean
): Promise<MinedResults> => {
  ;(lastMinedResults && lastMinedResults.next) ||
    !lastMinedResults ||
    orThrow(new Error('Next page was not found!'))
  const next = lastMinedResults ? lastMinedResults.next! : getMinedEndpoint(0)
  const html = await self.getHtmlFromEndpoint(next)
  const results = MinedResults.from(html)
  await processResultingItems(results.items)
  console.log('results', results)

  return !results || !results.next || skipRecursion
    ? results
    : await processNextPageOfMinedResults(results)
}

export const processNextPageOfLootedResults = async (
  lastLootedResults?: LootedResults,
  skipRecursion?: boolean
): Promise<LootedResults> => {
  ;(lastLootedResults && lastLootedResults.next) ||
    !lastLootedResults ||
    orThrow(new Error('Next page was not found!'))
  const next = lastLootedResults
    ? lastLootedResults.next!
    : getLootedEndpoint(0)
  const html = await self.getHtmlFromEndpoint(next)
  const results = LootedResults.from(html)
  await processResultingItems(results.items)
  console.log('results', results)

  return !results || !results.next || skipRecursion
    ? results
    : await processNextPageOfLootedResults(results)
}
