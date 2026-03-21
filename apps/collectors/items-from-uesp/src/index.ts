import 'dotenv/config'
import { Results } from './results'

const getEndpoint = (page: number | null) => {
  page = page ?? 0
  return `https://esolog.uesp.net/viewlog.php?start=${page * 1000}&record=minedItemSummary`
}

export const getHtmlFromEndpoint = async (
  endpoint: string,
  options?: {
    cookie: string
  }
): Promise<string> => {
  const cookie = options?.cookie || process.env.UESP_COOKIE
  if (!cookie) {
    throw new Error('No UESP_COOKIE env defined')
  }

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
    },
  })

  if (!res.ok) {
    throw new Error(`Failed: ${res.status} ${res.statusText}`)
  }

  return await res.text()
}

export const processNextPage = async (
  lastResults?: Results,
  skipRecursion?: boolean
): Promise<Results> => {
  if (lastResults && !lastResults.next) {
    throw new Error('Next page was not found!')
  }

  const next = lastResults ? lastResults.next! : getEndpoint(0)
  const html = await getHtmlFromEndpoint(next)
  const results = Results.from(html)

  // TODO - Do stuff
  console.log(results)

  return !results || !results.next || skipRecursion
    ? results
    : await processNextPage(results)
}
