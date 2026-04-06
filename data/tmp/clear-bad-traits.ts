
import {fileURLToPath} from "url";
import path from "path";
import {DatabaseSync} from "node:sqlite";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'artifacts', 'data.sqlite')
let _db: DatabaseSync
const db = () => {
    _db = _db || new DatabaseSync(dbPath)
    _db.exec('PRAGMA busy_timeout = 5000')
    return _db
}

const removeSingleKnownIdTraitMappings = () => {
    const database = db()

    const result = database.prepare(`
    DELETE FROM item_known_ids
    WHERE knownId IN (
      SELECT MIN(value) AS knownId
      FROM (
        SELECT items.internalId, je.value
        FROM items
        JOIN json_each(items.knownIds) AS je
      )
      GROUP BY internalId
      HAVING COUNT(DISTINCT value) = 1
    )
  `).run()

    return result.changes
}

removeSingleKnownIdTraitMappings()