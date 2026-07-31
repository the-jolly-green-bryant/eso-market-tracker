type SalesRollupReferenceType = {
  averageUnitPrice: number;
  blueAverageUnitPrice: number;
  commonQuantity: number;
  commonUnitPriceRangeLower: number;
  commonUnitPriceRangeUpper: number;
  date: string;
  goldAverageUnitPrice: number;
  greenAverageUnitPrice: number;
  numberOfQualitiesTracked: number;
  purpleAverageUnitPrice: number;
  whiteAverageUnitPrice: number;
};

/**
 * An aggregate market-price snapshot.
 */
export type SalesRollupType = SalesRollupReferenceType & {
  commonUnitPriceRangeLower: number;
  commonUnitPriceRangeUpper: number;
  maximumUnitPrice: number;
  medianUnitPrice: number;
  minimumUnitPrice: number;
};

/**
 * One current price observation for an exact trait and quality pair.
 */
export type VariantPriceType = {
  average: number;
  commonQuantity: number;
  date: string;
  maximum: number;
  minimum: number;
};

/**
 * Current prices keyed first by trait and then by quality.
 */
export type VariantPricingType = Record<
  string,
  Record<string, VariantPriceType>
>;

/**
 * Category details in portable format
 */
export type TradableItemCategoryReferenceType = {
  displayLabel: string;
  slug: string;
};

/**
 * Item details in portable format
 */
export type TradableItemReferenceType = {
  currentXboxStats: SalesRollupReferenceType;
  displayLabel: string;
  imageLink?: string;
  slug: string;
};

/**
 * Item details including market-price information
 */
export type TradableItemType = TradableItemReferenceType & {
  raw?: VariantPricingType;
  category?: TradableItemCategoryReferenceType;
  currentXboxStats: SalesRollupType;
  description?: string;
  detailedImageLink?: string;
  historicalXboxStats?: SalesRollupType[];
  howToAcquire?: string;
  isVolatile?: boolean;
  wikiLink?: string;
  relatedItems?: TradableItemReferenceType[];
  craftableSlug?: string;
  refinableSlug?: string;
  labelForAverage?: string;
  platform?: string;
  availablePlatforms?: string[];
};

/**
 * Category information including relevant items
 */
export type TradableItemCategoryType = TradableItemCategoryReferenceType & {
  items: TradableItemType[];
};
