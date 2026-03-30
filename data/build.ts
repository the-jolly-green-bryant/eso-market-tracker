import fs from 'fs'
import { Item, ItemMeta } from '@eso-market-tracker/eso'
import { fileURLToPath } from 'url'
import path from 'path'
import { db as emtDatabase, naming } from '@eso-market-tracker/database'
import { DatabaseSync } from 'node:sqlite'
import { logger } from '@eso-market-tracker/logging'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'artifacts', 'data.sqlite')
let _db: DatabaseSync
export const db = () => {
  _db = _db || new DatabaseSync(dbPath)
  _db.exec('PRAGMA busy_timeout = 5000')
  return _db
}

const createSchema = async () => {
  const client = db()
  client.exec(`
    CREATE TABLE IF NOT EXISTS items (
      internalId INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      bindType INTEGER,
      knownIds TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_items_shard_internal_id
      ON items (internalId);
  `)
}

export const insertItems = (items: Item[]) => {
  if (!items.length) return
  const client = db()
  const stmt = client.prepare(`
    INSERT INTO items (
      internalId,
      name,
      description,
      icon,
      bindType,
      knownIds
    ) VALUES (
      @internalId,
      @name,
      @description,
      @icon,
      @bindType,
      @knownIds
    )
    ON CONFLICT(internalId) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      bindType = excluded.bindType,
      knownIds = excluded.knownIds
  `)

  client.exec('BEGIN')
  try {
    items.forEach((i) =>
      stmt.run({ ...i.meta, knownIds: JSON.stringify(i.meta.knownIds) })
    )
    client.exec('COMMIT')
  } catch (e) {
    logger.error(e)
    client.exec('ROLLBACK')
    throw e
  }
}

export const buildDatabase = async () => {
  await createSchema()
  const items = await getItemsFromDirectory(path.join(__dirname, 'items'))
  insertItems(items)
}

const getFilesRecursively = (directory: string): string[] => {
  const entries = fs.readdirSync(directory, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return getFilesRecursively(fullPath)
    }

    if (entry.isFile() && fullPath.endsWith('.json')) {
      return [fullPath]
    }

    return []
  })
}

const getItemsFromDirectory = async (directory: string): Promise<Item[]> => {
  const filePaths = getFilesRecursively(directory)
  return await Promise.all(
    filePaths.map(async (filePath) =>
      emtDatabase.throttleFileWrites(async () => {
        const relativePath = 'data/' + path.relative(__dirname, filePath)
        const data = await emtDatabase.readFromFile(relativePath)

        if (!data) {
          throw new Error(`Could not read item file: ${relativePath}`)
        }

        return Item.from(data as ItemMeta)
      })
    )
  )
}

export const flattenDatabase = async (ids?: number[]) => {
  const stmt = db().prepare(
    `SELECT * FROM items ${ids && 'WHERE internalId in (' + ids.join(', ') + ')'}`
  )
  for (const row of stmt.iterate()) {
    const item = Item.from({
      ...row,
      knownIds: JSON.parse(row.knownIds as string),
    } as ItemMeta)
    const targetPath = naming.getItemPath(item)
    await emtDatabase.writeToFile(item.meta, targetPath, {
      preservedKeys: ['variantOf'],
    })
  }
}
