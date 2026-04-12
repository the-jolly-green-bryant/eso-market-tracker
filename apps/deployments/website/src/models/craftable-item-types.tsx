import { TradableItemReferenceType } from './tradable-item-types'

/**
 * A template for a craftable item
 */
export type CraftableSchemaReferenceType = {
  slug: string
  label: string
}

/**
 * A category of craftable items
 */
export type CraftableCategoryReferenceType = {
  slug: string
  displayLabel: string
  unlockedCategoryLabel?: string
}

/**
 * A simplified breakdown of a craftable item
 */
export type CraftableItemReferenceType = {
  slug: string
  displayLabel: string
  unlocks: string
}

/**
 * The total breakdown of a craftable
 */
export type CraftableCostBreakdownType = {
  totalCost: number
  requirements: {
    averageUnitPrice: number
    quantity: number
    item: TradableItemReferenceType
  }[]
}
