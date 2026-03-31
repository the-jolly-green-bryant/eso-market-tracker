import { Item, ItemMeta } from '@eso-market-tracker/eso'

export * from './build'
import { db } from './build'
import { getIdFromName, orThrow } from '@eso-market-tracker/logging'
import * as database from '@eso-market-tracker/database'
import * as cheerio from 'cheerio'

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

export const findItemByGameId = async (id: number) => {
  const stmt = db().prepare(`
    SELECT items.*
    FROM items
           INNER JOIN item_known_ids
                      ON item_known_ids.internalId = items.internalId
    WHERE item_known_ids.knownId = ?
    LIMIT 1
  `)

  const local = stmt.get(id)

  if (local) {
    return local
  }

  return await lookupIdInUESP(id)
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

const lookupIdInUESP = async (id: number) => {
  const r = await _queryUESP(
    `https://esolog.uesp.net/itemSearch.php?version=&text=${id}&level=&quality=&trait=&itemtype=&equiptype=&weapontype=&armortype=&enchant=&effect=&style=`
  )

  const $ = cheerio.load(r)
  const itemName = $(`a[itemid="${id}"]`).text().trim()
  const item = findItemByName(itemName)

  // Update our item so we don't need to do this lookup again.
  if (item) {
    // TODO - We could move this to the item class as a function.
    const targetPath = database.naming.getItemPath(Item.from(item))
    const oldData = (await database.db.readFromFile(
      targetPath
    )) as ItemMeta | null
    await database.db.writeToFile(
      {
        ...oldData,
        knownIds: oldData!.knownIds.concat([id]),
      },
      targetPath
    )
    console.log('thing')
  }

  return item
}
