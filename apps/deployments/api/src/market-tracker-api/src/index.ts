// language=md
const USAGE_MD = `
# ESO Market Tracker API

A lightweight read-only API for the Elder Scrolls Online Market Tracker. This service
 returns platform-specific pricing and trading information for items.

## Base URL

Replace with your deployed API URL:

https://data.esomarkettracker.com

## Endpoints

### Search items

\`GET /search/:term\`

Example:

\`\`\`shell
curl "https://data.esomarkettracker.com/search/dreugh%20wax"
\`\`\`

Response:

\`\`\`json
{
  "ok": true,
  "kind": "item",
  "query": [1393740546, 604228140, 556206086, 623099135],
  "results": [
    {
      "pricing": {
        "xbox-na": {
          "--": {
            "--": {
              "average": 2865,
              "date": "2025-12-06",
              "commonQuantity": 1,
              "minimum": 719,
              "maximum": 6685
            }
          }
        },
        "xbox-eu": {
          "--": {
            "--": {
              "average": 6881,
              "date": "2025-12-24",
              "commonQuantity": 1,
              "minimum": 4945,
              "maximum": 9302
            }
          }
        },
        "ps-eu": {
          "--": {
            "--": {
              "average": 7890,
              "date": "2025-12-24",
              "commonQuantity": 1,
              "minimum": 3300,
              "maximum": 60045
            }
          }
        },
        "ps-na": {
          "--": {
            "--": {
              "average": 3435,
              "date": "2025-12-24",
              "commonQuantity": 1,
              "minimum": 45,
              "maximum": 5625
            }
          }
        }
      },
      "item": {
        "internalId": 1393740546,
        "name": "Dreugh Wax",
        "description": "Improve quality from purple to gold.",
        "icon": "data/images/41/0_/no/crafting_outfitter_potion_014.png",
        "bindType": -1,
        "knownIds": "[54177]"
      }
    }
  ]
}
\`\`\`

### Fetch a single item

\`GET /item/:key\`

Example:

\`\`\`shell
curl "https://data.esomarkettracker.com/item/1393740546"
\`\`\`


Response:

\`\`\`json
{
  "ok": true,
  "kind": "item",
  "query": [
    "1393740546"
  ],
  "results": [
    {
      "pricing": {
        "xbox-na": {
          "--": {
            "--": {
              "average": 2865,
              "date": "2025-12-06",
              "commonQuantity": 1,
              "minimum": 719,
              "maximum": 6685
            }
          }
        },
        "xbox-eu": {
          "--": {
            "--": {
              "average": 6881,
              "date": "2025-12-24",
              "commonQuantity": 1,
              "minimum": 4945,
              "maximum": 9302
            }
          }
        },
        "ps-eu": {
          "--": {
            "--": {
              "average": 7890,
              "date": "2025-12-24",
              "commonQuantity": 1,
              "minimum": 3300,
              "maximum": 60045
            }
          }
        },
        "ps-na": {
          "--": {
            "--": {
              "average": 3435,
              "date": "2025-12-24",
              "commonQuantity": 1,
              "minimum": 45,
              "maximum": 5625
            }
          }
        }
      },
      "item": {
        "internalId": 1393740546,
        "name": "Dreugh Wax",
        "description": "Improve quality from purple to gold.",
        "icon": "data/images/41/0_/no/crafting_outfitter_potion_014.png",
        "bindType": -1,
        "knownIds": "[54177]"
      }
    }
  ]
}
\`\`\`


## Response format

\`\`\`json
{
  "ok": true,
  "kind": "item",
  "query": [
    "1393740546"                    // Any internal IDs that were tested in the lookup
  ],
  "results": [
    {
      "pricing": {
        "xbox-na": {                // The relevant ESO megaserver
          "--": {                   // The trait for the item (if applicable)
            "--": {                 // The quality for the item (if variable)
              "average": 2865,      // The average this item has sold for recently
              "date": "2025-12-06", // The date this data was compiled
              "commonQuantity": 1,  // The common stack size for this item
              "minimum": 719,       // The lowest this item sold for recently
              "maximum": 6685       // The most this item sold for recently
            }
          }
        },
        "xbox-eu": {
          "--": {
            "--": {
              "average": 6881,
              "date": "2025-12-24",
              "commonQuantity": 1,
              "minimum": 4945,
              "maximum": 9302
            }
          }
        },
        "ps-eu": {
          "--": {
            "--": {
              "average": 7890,
              "date": "2025-12-24",
              "commonQuantity": 1,
              "minimum": 3300,
              "maximum": 60045
            }
          }
        },
        "ps-na": {
          "--": {
            "--": {
              "average": 3435,
              "date": "2025-12-24",
              "commonQuantity": 1,
              "minimum": 45,
              "maximum": 5625
            }
          }
        }
      },
      "item": {
        "internalId": 1393740546,
        "name": "Dreugh Wax",
        "description": "Improve quality from purple to gold.",
        "icon": "data/images/41/0_/no/crafting_outfitter_potion_014.png",
        "bindType": -1,
        "knownIds": "[54177]"
      }
    }
  ]
}
\`\`\`

## Error format

\`\`\`json
{
  "ok": false,
  "error": "Message"
}
\`\`\`

## Status codes

200 - success  
400 - bad request  
404 - not found  
405 - method not allowed

`

import Fuse from 'fuse.js'
import { marked } from 'marked'

const SEARCH_LIMIT_DEFAULT = 10

type Env = {
  ESO_MARKET_TRACKER: KVNamespace
}

const __json = (
  body: Record<string, unknown> | Record<string, unknown>[],
  init?: ResponseInit
) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  })

const notFound = (message = 'Not Found') =>
  __json({ ok: false, error: message }, { status: 404 })

const badRequest = (message: string) =>
  __json({ ok: false, error: message }, { status: 400 })

const methodNotAllowed = () =>
  __json({ ok: false, error: 'Method Not Allowed' }, { status: 405 })

const items = async (keys: string[], env: Env) => {
  const body = (
    await Promise.all(
      keys.map(async (i) => env.ESO_MARKET_TRACKER.get(i, 'json'))
    )
  ).filter(Boolean)
  return (
    (body &&
      body.length &&
      __json({
        ok: true,
        kind: 'item',
        query: keys,
        results: body,
      })) ||
    notFound(`One or more items missing for keys "${keys}"`)
  )
}

type SearchItem = {
  name: string
  icon: string
  description: string
  internalId: string
  normalizedName: string
}

const __dedupe = <T>(items: T[], keyFn: (item: T) => string): T[] => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

let _fusePromise: Promise<[Fuse<SearchItem>, SearchItem[]]> | null = null

const __getFuse = async (
  env: Env
): Promise<[Fuse<SearchItem>, SearchItem[]]> => {
  _fusePromise ??= (async () => {
    const searchItems = ((await env.ESO_MARKET_TRACKER.get('SEARCH_INDEX', {
      type: 'json',
      cacheTtl: 3600,
    })) ?? []) as SearchItem[]

    const fuse = new Fuse(searchItems, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'normalizedName', weight: 0.3 },
      ],
      includeScore: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    })

    return [fuse, searchItems]
  })()

  return _fusePromise
}

const __normalize = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')

const search = async (term: string, env: Env) => {
  const query = __normalize(term.trim())
  if (!query) {
    return badRequest('Missing search term')
  }

  const limit = SEARCH_LIMIT_DEFAULT
  const [fuse, SEARCH_ITEMS] = await __getFuse(env)

  const exactMatches = SEARCH_ITEMS.filter(
    (item) =>
      item.normalizedName === query ||
      item.name.toLowerCase() === query.toLowerCase()
  ).slice(0, limit)

  const fuzzyMatches =
    exactMatches.length >= limit
      ? []
      : fuse.search(query, { limit }).map((result) => result.item)

  const ranked = __dedupe(
    [...exactMatches, ...fuzzyMatches],
    (item) => item.internalId
  )
    .slice(0, limit)
    .filter(Boolean)

  if (!ranked.length) {
    return notFound(`No items found for search term "${term}"`)
  }

  const keys = ranked.map((item) => item.internalId)
  return items(keys, env)
}

const docs = () => {
  return new Response(marked.parse(USAGE_MD) as string, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  })
}

const item = async (key: string, env: Env) => {
  const normalized = key.trim()
  return (
    (normalized && (await items([key], env))) || badRequest('Missing item key')
  )
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method !== 'GET') {
      return methodNotAllowed()
    }

    const url = new URL(request.url)
    const [route, ...rest] = url.pathname
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .filter(Boolean)

    const routeFn = { search, item }[route]
    return (routeFn && (await routeFn(rest.join('/'), env))) || docs()
  },
} satisfies ExportedHandler<Env>
