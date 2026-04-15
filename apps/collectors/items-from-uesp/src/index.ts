import 'dotenv/config'
import { LootedResults, MinedResults } from './results'
import { images } from '@eso-market-tracker/database'
import { logger, orThrow } from '@eso-market-tracker/logging'
import pLimit from 'p-limit'
import { insertItems } from '@eso-market-tracker/data'
import { Item } from '@eso-market-tracker/eso'
import * as self from './index'

type CrawlerOptions = {
  maxWrites?: number
}

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
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
      cookie,
      referer: 'https://esolog.uesp.net/viewlog.php',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'sec-ch-ua': '"Chromium";v="147", "Not.A/Brand";v="8"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
    },
  })

  res.ok || orThrow(new Error(`Failed: ${res.status} ${res.statusText}`))
  return await res.text()
}

const processResultingItems = async (
  results: [Item, [number, number, number | null]][],
  options?: CrawlerOptions
) => {
  const limit = pLimit(1)
  return Promise.all(
    results
      .slice(0, options?.maxWrites ?? results.length)
      .map((i) => i[0])
      .map(async (item) =>
        limit(async () => {
          if (!item.meta.icon) return item
          logger.info(`Saving image ${item.meta.icon}`)
          item.meta.icon = images.getOrDownloadImage(item.meta.icon)
          logger.info('Inserting Items')
          return item
        })
      )
  ).then((items) => insertItems(items, { skipInsertingTraits: true }))
}

export const processNextPageOfMinedResults = async (
  lastMinedResults?: MinedResults,
  skipRecursion?: boolean,
  options?: CrawlerOptions
) => {
  ;(lastMinedResults && lastMinedResults.next) ||
    !lastMinedResults ||
    orThrow(new Error('Next page was not found!'))
  const next = lastMinedResults ? lastMinedResults.next! : getMinedEndpoint(0)
  const html = await self.getHtmlFromEndpoint(next)
  logger.info('Grabbed HTML')
  const results = MinedResults.from(html)
  logger.info('Processed Results')
  const promises: Promise<unknown>[] = [
    processResultingItems(results.items, options),
  ]
  if (results && results.next && !skipRecursion) {
    const nextResultsComplete = processNextPageOfMinedResults(
      results,
      skipRecursion,
      options
    )
    promises.push(nextResultsComplete)
  }

  logger.info(results)

  return Promise.all(promises).then(() => results)
}

export const processNextPageOfLootedResults = async (
  lastLootedResults?: LootedResults,
  skipRecursion?: boolean,
  options?: CrawlerOptions
) => {
  ;(lastLootedResults && lastLootedResults.next) ||
    !lastLootedResults ||
    orThrow(new Error('Next page was not found!'))
  const next = lastLootedResults
    ? lastLootedResults.next!
    : getLootedEndpoint(0)
  const html = await self.getHtmlFromEndpoint(next)
  const results = LootedResults.from(html)
  const promises: Promise<unknown>[] = [
    processResultingItems(results.items, options),
  ]
  if (results && results.next && !skipRecursion) {
    const nextResultsComplete = processNextPageOfLootedResults(
      results,
      skipRecursion,
      options
    )
    promises.push(nextResultsComplete)
  }

  logger.info(results)

  return Promise.all(promises)
}
