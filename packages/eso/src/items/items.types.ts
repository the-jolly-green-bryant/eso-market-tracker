/**
 * Summary information about an item, including how to find base items related
 *  to this item.
 */
export type ItemMeta = {
  canonicalId: number
  variantOf: number | null
  trait: number | null
  name: string
  icon: string
  description: string
}
