type SalesRollupReferenceType = {
    averageUnitPrice: number
    blueAverageUnitPrice: number
    commonQuantity: number
    commonUnitPriceRangeLower: number
    commonUnitPriceRangeUpper: number
    goldAverageUnitPrice: number
    greenAverageUnitPrice: number
    numberOfQualitiesTracked: number
    purpleAverageUnitPrice: number
    totalSales: number
    recentSales: number
    totalUnitsSold: number
    whiteAverageUnitPrice: number
}

export type SalesRollupType = SalesRollupReferenceType & {
    commonUnitPriceRangeLower: number
    commonUnitPriceRangeUpper: number
    date: string
    maximumUnitPrice: number
    medianUnitPrice: number
    minimumUnitPrice: number
    totalSales: number
    recentSales: number
    totalUnitsSold: number
}

export type TradableItemCategoryReferenceType = {
    displayLabel: string
    slug: string
}

export type TradableItemReferenceType = {
    currentXboxStats: SalesRollupReferenceType
    displayLabel: string
    imageLink?: string
    slug: string
}

export type TradableItemType = TradableItemReferenceType & {
    category: TradableItemCategoryReferenceType
    currentXboxStats: SalesRollupType
    description?: string
    detailedImageLink?: string
    historicalXboxStats: SalesRollupType[]
    howToAcquire?: string
    isVolatile?: boolean
    wikiLink?: string
    relatedItems?: TradableItemReferenceType[]
    craftableSlug?: string
    refinableSlug?: string
    labelForAverage?: string
    labelForSales?: string
}

export type TradableItemCategoryType = TradableItemCategoryReferenceType & {
    items: TradableItemType[]
}

export type TrendGroupType = {
    label?: string
}

export type TrendDateType = {
    date?: string
    label?: string
}

export type TrendType = {
    visible?: boolean
    label?: string
    slug?: string
    itemSlugs?: string[]
    groupedSlugs?: string[][]
    initiallySelectedItemSlug?: string
    markedDates?: string[]
    groupDetails?: TrendGroupType[]
    dateDetails?: TrendDateType[]
    focusSales?: boolean
    focusDelta?: boolean
    focusTimespan?: number
}

export type StoreType = {
    label?: string
    slug?: string
}

export type ZoneType = {
    label?: string
    slug?: string
    stores?: StoreType[]
}

export type GuildType = {
    firstSaleDate?: string
    lastSaleDate?: string
    zones?: ZoneType[]
}

export type ItemBreakdownType = {
    label: string
    slug: string
    totalSales: number
    totalValue: number
}

export type IndividualCategoryBreakdownType = {
    label: string
    percentageOfGrandSales: number
    percentageOfGrandValue: number
    slug: string
    totalSales: number
    totalValue: number
    topItems: ItemBreakdownType[]
}

export type CategoryBreakdownType = {
    categories: IndividualCategoryBreakdownType[]
    grandSales: number
    grandValue: number
}
