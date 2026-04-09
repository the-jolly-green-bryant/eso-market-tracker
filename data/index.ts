import { Item, ItemMeta, TRAITS } from '@eso-market-tracker/eso'

export * from './build'
import { db } from './build'
import { getIdFromName, logger, orThrow } from '@eso-market-tracker/logging'
import * as database from '@eso-market-tracker/database'
import * as cheerio from 'cheerio'
import fs from 'fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let _TRAIT_INDEX: Record<number, [number, number | null]>
export const TRAIT_INDEX = async (): Promise<
  Record<number, [number, number | null]>
> => {
  if (_TRAIT_INDEX) return _TRAIT_INDEX

  const buf = await fs.promises.readFile(
    path.join(__dirname, 'index', 'traits.json')
  )
  const data = JSON.parse(buf.toString('utf8'))
  _TRAIT_INDEX = data as Record<number, [number, number | null]>
  return _TRAIT_INDEX
}

let _MASTER_PRICING_INDEX: Record<number, [number, number | null]>
export const MASTER_PRICING_INDEX = async (): Promise<
  Record<number, [number, number | null]>
> => {
  if (_MASTER_PRICING_INDEX) return _MASTER_PRICING_INDEX

  const buf = await fs.promises.readFile(
    path.join(__dirname, 'index', 'master-pricing.json')
  )
  const data = JSON.parse(buf.toString('utf8'))
  _MASTER_PRICING_INDEX = data as Record<number, [number, number | null]>
  return _MASTER_PRICING_INDEX
}

let _MASTER_ITEM_INDEX: Record<string, ItemMeta>
export const MASTER_ITEM_INDEX = async (): Promise<
  Record<string, ItemMeta>
> => {
  if (_MASTER_ITEM_INDEX) return _MASTER_ITEM_INDEX

  const buf = await fs.promises.readFile(
    path.join(__dirname, 'index', 'master-items.json')
  )
  const data = JSON.parse(buf.toString('utf8'))
  _MASTER_ITEM_INDEX = data as Record<string, ItemMeta>
  return _MASTER_ITEM_INDEX
}

export const findItemByName = (name: string) => {
  const normalized = getIdFromName(name)
  const stmt = db().prepare(`
    SELECT *
    FROM items
    WHERE internalId = ?
    LIMIT 1
  `)

  console.log(`${name} => ${normalized}`)
  return stmt.get(normalized) as unknown as ItemMeta | null
}

export const findItemByGameId = async (
  id: number
): Promise<ItemMeta | null> => {
  const stmt = db().prepare(`
    SELECT items.*
    FROM items
           INNER JOIN item_known_ids
                      ON item_known_ids.internalId = items.internalId
    WHERE item_known_ids.knownId = ?
    LIMIT 1
  `)

  const local = stmt.get(id) as unknown as ItemMeta | null

  if (local) {
    return local
  }

  const [item, _] = await lookupIdInUESP(id)
  return item
}

export const _queryUESP = async (
  endpoint: string,
  options?: {
    cookie: string
  }
): Promise<string> => {
  const cookie =
    options?.cookie ||
    process.env.UESP_COOKIE ||
    orThrow(new Error('No UESP_COOKIE env defined'))

  logger.info(`Endpoint: ${endpoint}`)
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

  const ignore =
    res.ok || orThrow(new Error(`Failed: ${res.status} ${res.statusText}`))
  return await res.text()
}

export const lookupIdInUESP = async (
  id: number
): Promise<[ItemMeta, string | null]> => {
  const r = await _queryUESP(
    `https://esolog.uesp.net/viewlog.php?action=view&record=item&id=${id}`
  )

  if (r.includes('Failed to retrieve record from database')) {
    return [null!, null]
  }

  const $ = cheerio.load(r)
  const itemName = $('th:contains("name")').next('td').text().trim()
  const item =
    findItemByName(itemName) ||
    orThrow(new Error(`Couldn't find item with id ${id}`))

  const description = $('th:contains("trait")').next('td').text().trim()
  const traitRegEx = new RegExp(` (${TRAITS.join('|')})$`)
  const trait = description.toLowerCase().match(traitRegEx)?.[1] ?? null

  // Update our item so we don't need to do this lookup again.
  // TODO - We could move this to the item class as a function.
  const targetPath = database.naming.getItemPath(Item.from(item))
  const oldData = (await database.db.readFromFile(
    targetPath
  )) as ItemMeta | null

  if (!oldData) {
    throw new Error(
      `Didn't find old data when there should be! ${JSON.stringify(item)} at ${targetPath}`
    )
  }

  await database.db.writeToFile(
    {
      ...oldData,
      knownIds: oldData!.knownIds.concat([id]),
    },
    targetPath
  )
  console.log('thing')
  return [item, trait]
}
