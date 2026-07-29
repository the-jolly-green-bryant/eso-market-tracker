import fs from "node:fs";
import fg from "fast-glob";
import * as fsPromises from "fs/promises";
import {
  getTraitIdFromString,
  Item,
  ItemMeta,
  ItemObservation,
  NO_KNOWN_TRAIT,
} from "@eso-market-tracker/eso";
import { fileURLToPath } from "url";
import path from "path";
import {
  db as emtDatabase,
  naming,
  constants,
} from "@eso-market-tracker/database";
import { DatabaseSync } from "node:sqlite";
import { logger } from "@eso-market-tracker/logging";
import { lookupIdInUESP, TRAIT_INDEX } from "./index";
import pLimit from "p-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "artifacts", "data.sqlite");
let _db: DatabaseSync;
export const db = () => {
  _db = _db || new DatabaseSync(dbPath);
  _db.exec("PRAGMA busy_timeout = 5000");
  return _db;
};

const createSchema = () => {
  const client = db();
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
      traitId INTEGER,
      PRIMARY KEY (knownId),
      FOREIGN KEY (internalId) REFERENCES items(internalId) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_item_known_ids_internal_id
      ON item_known_ids (internalId);
  `);
};

export const insertKnownId = async (
  knownId: number,
  internalId: number,
): Promise<void> => {
  if ([82016, 157522].includes(knownId)) {
    return;
  }

  let traitId: number | null =
    (await TRAIT_INDEX())[knownId]?.at(1) ??
    (
      db()
        .prepare(
          `
      SELECT traitId
      FROM item_known_ids
      WHERE knownId = ?
    `,
        )
        .get(knownId) as { traitId: number | null } | undefined
    )?.traitId ??
    null;

  // Only query UESP if we do not already know the trait.
  if (traitId == null) {
    // Github is blacklisted by UESP and will never be able to get a value from
    //  here. This functionality is tested locally, so no concerns.
    if (process.env.CI) {
      return;
    }

    const [_item, traitName] = await lookupIdInUESP(knownId);
    traitId = traitName ? getTraitIdFromString(traitName) : NO_KNOWN_TRAIT;
  }

  logger.info(
    `knownId=${knownId}, internalId=${internalId}, traitId=${traitId}`,
  );

  const stmt = db().prepare(`
    INSERT INTO item_known_ids (knownId, internalId, traitId)
    VALUES (?, ?, ?)
    ON CONFLICT(knownId) DO UPDATE SET
        internalId = excluded.internalId,
        traitId = COALESCE(item_known_ids.traitId, excluded.traitId)
  `);

  stmt.run(knownId, internalId, traitId);
};

export const insertItems = async (
  items: Item[],
  options?: { skipInsertingTraits?: boolean },
) => {
  if (!items.length) return;
  const client = db();
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
  `);

  const BATCH_SIZE = 50;
  const limit = pLimit(10);
  client.exec("BEGIN");
  const batchesDone = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchesEntered = batch.map((item) =>
      limit(async () => {
        stmt.run({
          ...item.meta,
          knownIds: JSON.stringify(item.meta.knownIds),
        });

        if (options?.skipInsertingTraits) {
          return;
        }

        const uniqueKnownIds = [...new Set(item.meta.knownIds)];
        const knownIdsEntered = uniqueKnownIds.map(async (k) =>
          insertKnownId(k, item.meta.internalId),
        );

        return Promise.all(knownIdsEntered);
      }),
    );

    batchesDone.push(Promise.all(batchesEntered));
  }

  return Promise.all(batchesDone).then(() => {
    client.exec("COMMIT");
    console.log("All inserted items committed.");
  });
};

const _directoryExists = async (dir: string) => {
  try {
    // TODO - This is failing, it needs to be relative to the project root.
    const fullPath = path
      .resolve(process.cwd(), dir)
      .replace("/data/data", "/data");
    const stat = await fsPromises.stat(fullPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};

const _getDirectories = async (dir: string): Promise<string[]> => {
  try {
    const fullPath = path
      .resolve(process.cwd(), dir)
      .replace("/data/data", "/data");
    const entries = await fsPromises.readdir(fullPath, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
};

const _getNestedFiles = (dir: string, baseDir = dir): string[] => {
  const fullPath = path
    .resolve(process.cwd(), dir)
    .replace("/data/data", "/data");
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getFilesRecursively(fullPath);
    }

    if (entry.isFile() && entry.name.endsWith(".json")) {
      return [path.relative(baseDir, fullPath)];
    }

    return [];
  });
};

const buildPricingData = async (item: Item) => {
  const itemDirectory = naming.getItemDirectory(item);
  const observationDirectory = `${itemDirectory.replace("items", "observations")}/${item.id}`;

  // Get any folders in the observation directory. This will tell us what
  //  variants we have access to.

  const _getVariants = async () => {
    const variantsFromObservations =
      await _getDirectories(observationDirectory);
    const variantsFromItems = await getKnownVariantsForItem(
      itemDirectory,
      item.id,
    );
    return [...new Set([...variantsFromObservations, ...variantsFromItems])];
  };

  const variants = await _getVariants();
  return (
    await Promise.all(
      variants
        .map(async (variantId) => {
          // Cleans up bad data. Ultimately obsolete.
          if (
            variantId.includes("--1---") &&
            variants.includes(variantId.replace("--1---", "------"))
          ) {
            const variantPattern = `${__dirname}/../${itemDirectory}/${variantId}.*.*.json`;
            await Promise.all(
              (await fg([variantPattern])).map((i) =>
                fs.promises.rm(i, { force: true }),
              ),
            );
            return [];
          }

          const variantDirectory = `${observationDirectory}/${variantId}`;
          const availablePlatforms = [
            constants.XBOX_NA,
            constants.XBOX_EU,
            constants.PS_EU,
            constants.PS_NA,
          ];
          const platforms = await _getDirectories(variantDirectory);
          return (
            await Promise.all(
              availablePlatforms.map(async (p) => {
                const platformDirectory = `${variantDirectory}/${p}`;
                const historicalDataPath = `${itemDirectory}/${variantId}.${p}.historical.json`;
                const rawOldData =
                  (await emtDatabase.readFromFile(historicalDataPath)) || {};

                let oldData = (
                  Array.isArray(rawOldData)
                    ? rawOldData
                    : rawOldData
                      ? Object.values(rawOldData)
                      : []
                ) as ItemObservation["stats"][];

                if (platforms.includes(p)) {
                  // Get every relative path for files deeply nested in this directory.
                  const observations = oldData
                    .concat(
                      (await Promise.all(
                        _getNestedFiles(platformDirectory).map(
                          async (filePath) =>
                            await emtDatabase.readFromFile(filePath),
                        ),
                      )) as ItemObservation["stats"][],
                    )
                    .filter((i) => i && i.maximum)
                    .sort((a, b) => a.date.localeCompare(b.date));

                  // Remove our duplicates.
                  const unique = Array.from(
                    new Map(observations.map((o) => [o.date, o])).values(),
                  ) as ItemObservation["stats"][];

                  // Write everything out to the master history file.
                  await emtDatabase.deleteFile(historicalDataPath);
                  await emtDatabase.writeToFile(
                    { ...unique } as Record<
                      number,
                      Record<string, number | string | null>
                    >,
                    historicalDataPath,
                  );
                  logger.info(`Wrote to ${historicalDataPath}`);

                  oldData = unique;
                }

                if (oldData.length) {
                  // Write our latest entry to file.
                  await emtDatabase.writeToFile(
                    oldData.at(-1)!,
                    historicalDataPath.replace("historical", "current"),
                  );

                  return [[`${variantId}.${p}`, oldData.at(-1)]];
                }

                return [];
              }),
            )
          ).flat();
        })
        .filter(Boolean),
    )
  ).flat();
};

export const buildDatabase = async (options?: {
  skipInsertingTraits?: boolean;
  itemIds?: number[];
}) => {
  createSchema();
  logger.info("Created Schema");
  const items = await getItemsFromDirectory(
    path.join(__dirname, "items"),
    options?.itemIds,
  );
  const insertingDone = insertItems(items, options);
  logger.info("Grabbed Items");
  const pairs = (
    await Promise.all(
      items.map(async (i) =>
        emtDatabase.throttleFileWrites(async () => await buildPricingData(i)),
      ),
    )
  )
    .flat()
    .filter(Boolean);
  logger.info("Built pricing data");

  // Log pricing to master file for quicker building.
  const pricing = Object.fromEntries(pairs);
  const indexPath = "data/index/master-pricing.json";
  const pricingDone = emtDatabase
    .writeToFile(pricing, indexPath)
    .then(() => logger.info("Pricing Data Saved"));
  return Promise.all([insertingDone, pricingDone]);
};

const getFilesRecursively = (directory: string): string[] => {
  const readPath = path
    .resolve(process.cwd(), directory)
    .replace("/data/data", "/data");

  const entries = fs.readdirSync(readPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return getFilesRecursively(fullPath);
    }

    if (entry.isFile() && fullPath.endsWith(".json")) {
      return [fullPath];
    }

    return [];
  });
};

const getKnownVariantsForItem = async (
  directory: string,
  internalId: number,
) => {
  const filePaths = await fg([
    `${__dirname}/../${directory}/${internalId}*.*.historical.json`,
  ]);
  return filePaths
    .map((i) => i.split("/").at(-1)!)
    .map((i) => i.replace(/(.*?)\..*?\.historical\.json/, "$1"));
};

const getItemsFromDirectory = async (
  directory: string,
  itemIds?: number[],
): Promise<Item[]> => {
  const filePaths = itemIds?.length
    ? [...new Set(itemIds)].map((id) =>
        path.resolve(__dirname, "..", naming.getItemPathFromId(id)),
      )
    : await fg([
        `${directory}/**/*.json`,
        `!${directory}/**/*.historical.json`,
        `!${directory}/**/*.current.json`,
      ]);

  const itemsRetrieved = filePaths.map(async (filePath) => {
    const data = JSON.parse(await fs.promises.readFile(filePath, "utf8"));

    if (!data || !data.internalId) {
      throw new Error(`Could not read item file: ${filePath}`);
    }

    return Item.from(data as ItemMeta);
  });

  return Promise.all(itemsRetrieved);
};

const _writeItems = async (ids?: number[]) => {
  const sql =
    ids && ids.length > 0
      ? `SELECT * FROM items WHERE internalId IN (${ids.join(", ")})`
      : `SELECT * FROM items`;

  const stmt = db().prepare(sql);
  logger.info("Preparing to write items.");
  const writes: Promise<unknown>[] = [];
  const itemIndex: Record<string, ItemMeta> = {};
  for (const row of stmt.iterate()) {
    const item = Item.from({
      ...row,
      knownIds: JSON.parse(row.knownIds as string),
    } as ItemMeta);
    const targetPath = naming.getItemPath(item);
    itemIndex[item.meta.name] = item.meta;
    writes.push(emtDatabase.writeToFile(item.meta, targetPath));
  }

  writes.push(
    emtDatabase.writeToFile(itemIndex, "data/index/master-items.json"),
  );

  logger.info("Starting to write items.");
  return Promise.all(writes).then(() =>
    logger.info("Completed all item writes!"),
  );
};

export const flattenDatabase = async (ids?: number[]) => {
  const writesDone = _writeItems(ids);
  const indexPath = "data/index/traits.json";
  const index = ((await TRAIT_INDEX()) || {}) as Record<
    number,
    (number | null)[]
  >;
  logger.info("Preparing to write traits.");
  const traitStatement = db().prepare(`SELECT * FROM item_known_ids`);
  logger.info("Pulled traits.");
  const traitEntries = traitStatement.all().map((row) => {
    return [
      row.knownId as number,
      [row.internalId as number, row.traitId as number | null],
    ];
  });

  const indexWriteDone = emtDatabase.writeToFile(
    { ...index, ...Object.fromEntries(traitEntries) },
    indexPath,
  );
  logger.info("Wrote traits.");

  return Promise.all([indexWriteDone, writesDone]);
};
