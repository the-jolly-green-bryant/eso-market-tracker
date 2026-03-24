import fs from 'fs'
import { Item, ItemMeta } from '@eso-market-tracker/eso'
import { fileURLToPath } from 'url'
import path from 'path'
import { db as emtDatabase, naming } from '@eso-market-tracker/database'
import { DatabaseSync } from 'node:sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'artifacts', 'data.sqlite')
export const db = new DatabaseSync(dbPath)

const createSchema = async () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      canonicalId INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      trait INTEGER,
      variantOf INTEGER,
      bindType INTEGER
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_items_shard_canonical_id
      ON items (canonicalId);
  `)
}

export const insertItems = (items: Item[]) => {
  const stmt = db.prepare(`
    INSERT INTO items (
      canonicalId,
      name,
      description,
      icon,
      trait,
      variantOf,
      bindType
    ) VALUES (
      @canonicalId,
      @name,
      @description,
      @icon,
      @trait,
      @variantOf,
      @bindType
    )
    ON CONFLICT(canonicalId) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      trait = excluded.trait,
      variantOf = excluded.variantOf,
      bindType = excluded.bindType
  `)

  db.exec('BEGIN')
  try {
    items.forEach((i) => stmt.run(i.meta))
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
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

export const flattenDatabase = async () => {
  const dbPath = path.join(__dirname, 'artifacts', 'data.sqlite')
  const db = new DatabaseSync(dbPath)
  const stmt = db.prepare(`SELECT * FROM items`)
  for (const row of stmt.iterate()) {
    const item = Item.from(row as ItemMeta)
    const targetPath = naming.getItemPath(item)
    await emtDatabase.writeToFile(item.meta, targetPath, {
      preservedKeys: ['variantOf'],
    })
  }
}
