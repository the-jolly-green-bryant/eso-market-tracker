export * from './build'
import { db } from './build'

export const findItemByName = (name: string) => {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '')

  const stmt = db.prepare(`
    SELECT *
    FROM items
    WHERE lower(replace(replace(replace(replace(replace(name, ' ', ''), '''', ''), ':', ''), ',', ''), '-', '')) = ?
    ORDER BY
      CASE WHEN trait IS NULL THEN 0 ELSE 1 END,
      trait
    LIMIT 1
  `)

  return stmt.get(normalized)
}
