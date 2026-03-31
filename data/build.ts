import fs from 'fs'
import * as fsPromises from 'fs/promises'
import { Item, ItemMeta, ItemObservation } from '@eso-market-tracker/eso'
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
    PRAGMA foreign_keys = ON;

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
      
    CREATE TABLE IF NOT EXISTS item_known_ids (
      knownId INTEGER NOT NULL,
      internalId INTEGER NOT NULL,
      PRIMARY KEY (knownId),
      FOREIGN KEY (internalId) REFERENCES items(internalId) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_item_known_ids_internal_id
      ON item_known_ids (internalId);
  `)
}

export const insertKnownId = (knownId: number, internalId: number) => {
  const stmt = db().prepare(`
    INSERT INTO item_known_ids (knownId, internalId)
    VALUES (?, ?)
    ON CONFLICT(knownId) DO UPDATE SET
      internalId = excluded.internalId
  `)

  stmt.run(knownId, internalId)
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
    items.forEach((i) => {
      stmt.run({ ...i.meta, knownIds: JSON.stringify(i.meta.knownIds) })
      i.meta.knownIds.forEach((k) => insertKnownId(k, i.meta.internalId))
    })
    client.exec('COMMIT')
  } catch (e) {
    logger.error(e)
    client.exec('ROLLBACK')
    throw e
  }
}

const _directoryExists = async (dir: string) => {
  try {
    // TODO - This is failing, it needs to be relative to the project root.
    const fullPath = path
      .resolve(process.cwd(), dir)
      .replace('/data/data', '/data')
    const stat = await fsPromises.stat(fullPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}

const _getDirectories = async (dir: string): Promise<string[]> => {
  const fullPath = path
    .resolve(process.cwd(), dir)
    .replace('/data/data', '/data')
  const entries = await fsPromises.readdir(fullPath, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

const _getNestedFiles = (dir: string, baseDir = dir): string[] => {
  const fullPath = path
    .resolve(process.cwd(), dir)
    .replace('/data/data', '/data')
  const entries = fs.readdirSync(fullPath, { withFileTypes: true })

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return getFilesRecursively(fullPath)
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      return [path.relative(baseDir, fullPath)]
    }

    return []
  })
}

const buildPricingData = async (item: Item) => {
  // TODO - Insert a function that pulls latest pricing data into the items
  //  folder. We want to maintain discrete data for quality, trait, and the
  //  platform. For each platform, if not available, use xboxna

  const itemDirectory = naming.getItemDirectory(item)
  const observationDirectory = `${itemDirectory.replace('items', 'observations')}/${item.id}`

  // If the observation directory doesn't exist, we don't have any data for this
  //  item.

  if (!(await _directoryExists(observationDirectory))) {
    return
  }

  // Get any folders in the observation directory. This will tell us what
  //  variants we have access to.

  const variants = await _getDirectories(observationDirectory)
  variants.forEach(async (variantId) => {
    const variantDirectory = `${observationDirectory}/${variantId}`
    const platforms = await _getDirectories(variantDirectory)
    platforms.forEach(async (p) => {
      const platformDirectory = `${variantDirectory}/${p}`
      const historicalDataPath = `${itemDirectory}/${variantId}.${p}.historical.json`
      const rawOldData =
        (await emtDatabase.readFromFile(historicalDataPath)) || {}
      const oldData = (
        Array.isArray(rawOldData)
          ? rawOldData
          : rawOldData
            ? Object.values(rawOldData)
            : []
      ) as ItemObservation['stats'][]

      // Get every relative path for files deeply nested in this directory.
      const observations = oldData
        .concat(
          (await Promise.all(
            _getNestedFiles(platformDirectory).map(
              async (filePath) => await emtDatabase.readFromFile(filePath)
            )
          )) as ItemObservation['stats'][]
        )
        .filter((i) => i && i.maximum)
        .sort((a, b) => a.date.localeCompare(b.date))

      // Remove our duplicates.
      const unique = Array.from(
        new Map(observations.map((o) => [o.date, o])).values()
      ) as ItemObservation['stats'][]

      // Write everything out to the master history file.
      await emtDatabase.deleteFile(historicalDataPath)
      await emtDatabase.writeToFile(
        { ...unique } as Record<number, Record<string, number | string | null>>,
        historicalDataPath
      )
      logger.info(`Wrote to ${historicalDataPath}`)

      // Write our latest entry to file.
      if (unique.length) {
        await emtDatabase.writeToFile(
          unique.at(-1)!,
          historicalDataPath.replace('historical', 'current')
        )
      }
    })
  })
}

export const buildDatabase = async () => {
  await createSchema()
  const items = await getItemsFromDirectory(path.join(__dirname, 'items'))
  Promise.all(
    items.map(async (i) => {
      emtDatabase.throttleFileWrites(async () => {
        await buildPricingData(i)
      })
    })
  )

  insertItems(items)
  // TODO - Update pricing information in database
}

const getFilesRecursively = (directory: string): string[] => {
  const readPath = path
    .resolve(process.cwd(), directory)
    .replace('/data/data', '/data')

  const entries = fs.readdirSync(readPath, { withFileTypes: true })
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
  const filePaths = getFilesRecursively(directory).filter(
    (i) => !i.includes('.historical.') && !i.includes('.current.')
  )
  const items = await Promise.all(
    filePaths.flatMap(async (filePath) =>
      emtDatabase.throttleFileWrites(async () => {
        const relativePath = 'data/' + path.relative(__dirname, filePath)
        const data = await emtDatabase.readFromFile(relativePath)

        if (!data) {
          throw new Error(`Could not read item file: ${relativePath}`)
        }

        if (!data.internalId) {
          return []
        }

        return [Item.from(data as ItemMeta)]
      })
    )
  )

  return items.flat()
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
