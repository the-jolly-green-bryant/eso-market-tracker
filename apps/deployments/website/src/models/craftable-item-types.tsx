import { TradableItemReferenceType } from './tradable-item-types'

export type CraftableSchemaReferenceType = {
    slug: string
    label: string
}

export type CraftableCategoryReferenceType = {
    slug: string
    displayLabel: string
    unlockedCategoryLabel?: string
}

export type CraftableItemReferenceType = {
    slug: string
    displayLabel: string
    unlocks: string
}

export type CraftableCategoryWithItemsType = CraftableCategoryReferenceType & {
    craftables: CraftableItemReferenceType[]
}

export type CategorySelection = {
    categories: CraftableCategoryWithItemsType[]
}

export type CraftableSchemaWithCategoriesType = CraftableSchemaReferenceType & {
    categories: CraftableCategoryWithItemsType[]
    oneOfCategories: CategorySelection[]
}

export type CraftableCostBreakdownRequirementType = {
    averageUnitPrice: number
    quantity: number
    item: TradableItemReferenceType
}

export type CraftableCostBreakdownType = {
    totalCost: number
    requirements: CraftableCostBreakdownRequirementType[]
}
