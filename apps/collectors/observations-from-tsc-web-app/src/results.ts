import {
  Item,
  ItemMeta,
  ItemObservation,
  legacyNaming,
} from '@eso-market-tracker/eso'
import * as db from '@eso-market-tracker/data'
import { logger } from '@eso-market-tracker/logging'

const findItemByName = (
  itemsByNormalizedName: Map<string, ItemMeta>,
  name: string
): ItemMeta | undefined => {
  const normalizedName = legacyNaming.nameToInternal(name)
  const legacyName = legacyNaming.internalToName(normalizedName)

  logger.info(`Checking legacy name ${legacyName}, original ${name}`)
  return itemsByNormalizedName.get(normalizedName)
}

/**
 * Representation of the data retrieved from AppSheet
 */
export type TSCAppData = {
  NestedDataSets: {
    Name: string
    DataSet: string
    data?: {
      data: string[11][]
    }[]
  }[]
}

const parseRawData = (rawData: TSCAppData) => ({
  ...rawData,
  NestedDataSets: rawData.NestedDataSets.filter(
    (i) => i.Name == 'Item Categories'
  ).map((i) => ({
    ...i,
    data: JSON.parse(i.DataSet),
  })),
})

const parseObservations = (
  rawData: TSCAppData,
  itemsByNormalizedName: Map<string, ItemMeta>
): ItemObservation[] => {
  const data = parseRawData(rawData)
  const match = RegExp(/\b(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\b/).exec(
    rawData.NestedDataSets.find((i) => i.Name === 'Updates')!.DataSet
  )!

  const [month, day, yearRaw] = match.slice(1)

  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw

  const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`

  return data.NestedDataSets.at(0)
    ?.data!.data.filter(
      (row: string[11]) =>
        ![
          'Runebound Tome: Mask of Battled Powers Adornment',
          // These are items in TSC that don't appear to exist in game...
          'Bent Iron Buckle',
          'Chipped Bone Ring',
          'Faded Cloth Sash',
          'Loose Leather Cord',
          'Worn Leather Binding',
        ].includes(row[1])
    )
    .flatMap((row: string[11]): ItemObservation[] => {
      const item = findItemByName(itemsByNormalizedName, row[1])
      if (!item) {
        logger.warn(`Skipping unknown item from TSC web app: ${row[1]}`)
        return []
      }

      return [
        {
          item: Item.from(item),
        stats: {
          average: parseInt(row[3]),
          date,
          commonQuantity: parseInt(row[7]),
          minimum: parseInt(row[4].replace(/(.*) - .*/, '$1')),
          maximum: parseInt(row[4].replace(/.* - (.*)/, '$1')),
        },
        },
      ]
    })
}

/**
 * The parsed results from the TSC web app.
 */
export type Results = ReturnType<(typeof Results)['from']>
export const Results = {
  from: async (data: TSCAppData) => {
    const itemIndex = await db.MASTER_ITEM_INDEX()
    const itemsByNormalizedName = new Map(
      Object.entries(itemIndex).map(([name, item]) => [
        legacyNaming.nameToInternal(name),
        item,
      ])
    )
    return {
      observations: parseObservations(data, itemsByNormalizedName),
    }
  },
}
