import { ItemMeta } from './items.types'

/**
 * A class-like representation of an ESO item.
 */
export type Item = ReturnType<(typeof Item)['from']>
export const Item = {
  from(meta: ItemMeta) {
    return {
      id: meta.variantOf ?? meta.canonicalId,
      meta,
    }
  },
}
