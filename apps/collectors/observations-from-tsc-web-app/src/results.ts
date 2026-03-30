import {
  Item,
  ItemMeta,
  ItemObservation,
  legacyNaming,
} from '@eso-market-tracker/eso'
import * as db from '@eso-market-tracker/data'
import { logger, orThrow } from '@eso-market-tracker/logging'

const findItemByName = (name: string): ItemMeta => {
  const legacyName = legacyNaming.internalToName(
    legacyNaming.nameToInternal(name)
  )

  logger.info(`Checking legacy name ${legacyName}, original ${name}`)
  return db.findItemByName(legacyName) as unknown as ItemMeta
}

type TSCAppData = {
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

const parseObservations = (rawData: TSCAppData): ItemObservation[] => {
  const data = parseRawData(rawData)
  return data.NestedDataSets.at(0)
    ?.data!.data.filter(
      (row: string[11]) =>
        !['Runebound Tome: Mask of Battled Powers Adornment'].includes(row[1])
    )
    .map(
      (row: string[11]): ItemObservation => ({
        item: Item.from(
          findItemByName(row[1]) ||
            orThrow(new Error(`No item found for ${row[1]}`))
        ),
        stats: {
          average: parseInt(row[3]),
          date: rawData.NestedDataSets.filter((i) => i.Name == 'Updates')
            .at(0)!
            .DataSet.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/)!
            .slice(1)
            .reduce(
              (_, __, ___, arr) =>
                `${arr[2]}-${arr[0].padStart(2, '0')}-${arr[1].padStart(2, '0')}`
            )!,
          commonQuantity: parseInt(row[7]),
          minimum: parseInt(row[4].replace(/(.*) - .*/, '$1')),
          maximum: parseInt(row[4].replace(/.* - (.*)/, '$1')),
        },
      })
    )
    .filter((i: ItemObservation) => i.item)
}

/**
 * The parsed results from the TSC web app.
 */
export type Results = ReturnType<(typeof Results)['from']>
export const Results = {
  from: async (data: TSCAppData) => ({
    observations: parseObservations(data),
  }),
}
