export * from './build'
import { db } from './build'

export const findItemByName = (name: string) => {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const stmt = db.prepare(`
    SELECT *
    FROM items
    WHERE lower(replace(replace(replace(name, ' ', ''), '''', ''), ':', '')) = ?
    LIMIT 1
  `)

  return stmt.get(normalized)
}
