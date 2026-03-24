/**
 * Summary information about an item, including how to find base items related
 *  to this item.
 */
export type ItemMeta = {
  internalId: number
  name: string
  icon: string | null
  description: string
  bindType: number
  knownIds: number[]
}
