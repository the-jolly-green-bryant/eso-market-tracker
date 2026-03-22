import { ItemMeta } from './items.types'

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

    if (Number.isNaN(item.id)) {
      throw new Error(`item ${JSON.stringify(item)} is not a number!`)
    }

    return item
  },
}
