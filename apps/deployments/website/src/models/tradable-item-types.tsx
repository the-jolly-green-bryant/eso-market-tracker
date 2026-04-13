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

/**
 * An aggregate snapshot of sales.
 */
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

/**
 * Category details in portable format
 */
export type TradableItemCategoryReferenceType = {
  displayLabel: string
  slug: string
}

/**
 * Item details in portable format
 */
export type TradableItemReferenceType = {
  currentXboxStats: SalesRollupReferenceType
  displayLabel: string
  imageLink?: string
  slug: string
}

/**
 * Item details including sales info
 */
export type TradableItemType = TradableItemReferenceType & {
  raw?: Record<string, Record<string, { average: number }>>
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

/**
 * Category information including relevant items
 */
export type TradableItemCategoryType = TradableItemCategoryReferenceType & {
  items: TradableItemType[]
}

/**
 * A grouping of items for a trend
 */
export type TrendGroupType = {
  label?: string
}

/**
 * A highlighted date for a trend.
 */
export type TrendDateType = {
  date?: string
  label?: string
}

/**
 * Instructions for generating a trend analysis
 */
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

/**
 * A guild trader in ESO
 */
export type StoreType = {
  label?: string
  slug?: string
}

/**
 * A zone in ESO
 */
export type ZoneType = {
  label?: string
  slug?: string
  stores?: StoreType[]
}

/**
 * A guild in ESO
 */
export type GuildType = {
  firstSaleDate?: string
  lastSaleDate?: string
  zones?: ZoneType[]
}

/**
 * A quick summary of an items performance for a guild
 */
export type ItemBreakdownType = {
  label: string
  slug: string
  totalSales: number
  totalValue: number
}

/**
 * A summary of category sales for a guild
 */
export type IndividualCategoryBreakdownType = {
  label: string
  percentageOfGrandSales: number
  percentageOfGrandValue: number
  slug: string
  totalSales: number
  totalValue: number
  topItems: ItemBreakdownType[]
}

/**
 * A breakdown of all categories for a guild
 */
export type CategoryBreakdownType = {
  categories: IndividualCategoryBreakdownType[]
  grandSales: number
  grandValue: number
}
