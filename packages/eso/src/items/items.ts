import { ItemMeta } from './items.types'
import { orThrow } from '@eso-market-tracker/logging'

/**
 * A class-like representation of an ESO item.
 */
export type Item = ReturnType<(typeof Item)['from']>
export const Item = {
  from(meta: ItemMeta) {
    const item = {
      id: meta.variantOf ?? meta.canonicalId,
      meta,
    }

    Number.isInteger(item.id) ||
      orThrow(new Error(`item ${JSON.stringify(item)} is not a number!`))
    return item
  },
}
