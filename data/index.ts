export * from './build'
import { db } from './build'
import { getIdFromName } from '@eso-market-tracker/logging'

export const findItemByName = (name: string) => {
  const normalized = getIdFromName(name)
  const stmt = db().prepare(`
    SELECT *
    FROM items
    WHERE internalId = ?
    LIMIT 1
  `)

  console.log(`${name} => ${normalized}`)
  return stmt.get(normalized)
}
