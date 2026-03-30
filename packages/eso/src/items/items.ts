import { ItemMeta } from './items.types'
import { getIdFromName, orThrow } from '@eso-market-tracker/logging'

/**
 * A class-like representation of an ESO item.
 */
export type Item = ReturnType<(typeof Item)['from']>
export const Item = {
  from(
    meta: ItemMeta,
    additional?: { quality?: number | null; trait?: number | null }
  ) {
    const item = {
      id: getIdFromName(meta.name),
      quality: additional?.quality ?? null,
      trait: additional?.trait ?? null,
      meta,
    }

    Number.isInteger(item.id) ||
      orThrow(new Error(`item ${JSON.stringify(item)} is not a number!`))
    return item
  },
}

/**
 * A point-in-time observation of the value of a given item.
 */
export type ItemObservation = {
  item: Item
  stats: {
    average: number
    date: string
    commonQuantity: number
    minimum: number
    maximum: number
  }
}
