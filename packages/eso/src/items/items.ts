import { ItemMeta } from './items.types'
import { orThrow } from '@eso-market-tracker/logging'

/**
 * A class-like representation of an ESO item.
 */
export type Item = ReturnType<(typeof Item)['from']>
export const Item = {
  from(meta: ItemMeta, additional?: { quality: number | null }) {
    const item = {
      id: meta.variantOf ?? meta.canonicalId,
      quality: additional?.quality ?? null,
      meta,
    }

    Number.isInteger(item.id) ||
      orThrow(new Error(`item ${JSON.stringify(item)} is not a number!`))
    return item
  },
}
