import {
  SalesRollupType,
  TradableItemType,
  VariantPriceType,
} from "./models/tradable-item-types";

const TRAIT_NAMES: Record<string, string> = {
  "01": "Powered",
  "02": "Charged",
  "03": "Precise",
  "04": "Infused",
  "05": "Defending",
  "06": "Training",
  "07": "Sharpened",
  "08": "Decisive",
  "09": "Intricate",
  "10": "Ornate",
  "11": "Sturdy",
  "12": "Impenetrable",
  "13": "Reinforced",
  "14": "Well Fitted",
  "15": "Training",
  "16": "Infused",
  "17": "Invigorating",
  "18": "Divines",
  "19": "Ornate",
  "20": "Intricate",
  "21": "Healthy",
  "22": "Arcane",
  "23": "Robust",
  "24": "Ornate",
  "25": "Nirnhoned",
  "26": "Nirnhoned",
  "27": "Intricate",
  "28": "Swift",
  "29": "Harmony",
  "30": "Triune",
  "31": "Bloodthirsty",
  "32": "Protective",
  "33": "Infused",
  "34": "Quickened",
  "35": "Prolific",
  "36": "Focused",
  "37": "Shattering",
  "38": "Aggressive",
  "39": "Soothing",
  "40": "Augmented",
  "41": "Bolstered",
  "42": "Vigorous",
  "43": "Quickened",
  "44": "Prolific",
  "45": "Focused",
  "46": "Shattering",
  "47": "Aggressive",
  "48": "Soothing",
  "49": "Augmented",
  "50": "Bolstered",
  "51": "Vigorous",
  "52": "Quickened",
  "53": "Prolific",
  "54": "Focused",
  "55": "Shattering",
  "56": "Aggressive",
  "57": "Soothing",
  "58": "Augmented",
  "59": "Bolstered",
  "60": "Vigorous",
};

const QUALITY_NAMES: Record<string, string> = {
  "01": "Common",
  "02": "Fine",
  "03": "Superior",
  "04": "Epic",
  "05": "Legendary",
};

const normalizedId = (id: string) =>
  /^-?\d+$/.test(id) ? Math.abs(Number(id)).toString().padStart(2, "0") : id;

const unique = (values: string[]) => [...new Set(values)];

const variantName = (
  id: string,
  names: Record<string, string>,
  fallback: string,
) => names[normalizedId(id)] ?? `${fallback} ${Number(id) || id}`;

/**
 * Human-readable trait and quality variants available for one market item.
 */
export type ItemVariantMetadata = {
  qualities: string[];
  traits: string[];
};

/**
 * One selectable trait or quality value.
 */
export type ItemVariantOption = {
  id: string;
  label: string;
};

/**
 * Trait choices and the quality choices available for the selected trait.
 */
export type ItemVariantOptions = {
  qualities: ItemVariantOption[];
  traits: ItemVariantOption[];
};

const variantOptions = (
  ids: string[],
  names: Record<string, string>,
  fallback: string,
  hasAggregate: boolean,
  aggregateLabel: string,
) => [
  ...(hasAggregate ? [{ id: "--", label: aggregateLabel }] : []),
  ...ids.map((id) => ({
    id,
    label: variantName(id, names, fallback),
  })),
];

/**
 * Selectable variants for an item. Qualities are scoped to the selected trait
 * because not every trait necessarily exists at every quality.
 */
export const getItemVariantOptions = (
  raw: TradableItemType["raw"],
  traitId = "--",
): ItemVariantOptions => {
  if (!raw) return { traits: [], qualities: [] };

  const traitIds = Object.keys(raw)
    .filter((id) => id !== "--")
    .sort((a, b) => Number(a) - Number(b));
  const selectedTrait =
    raw[traitId] ?? raw["--"] ?? raw[traitIds.at(0) ?? "--"] ?? {};
  const qualityIds = Object.keys(selectedTrait)
    .filter((id) => id !== "--")
    .sort((a, b) => Number(a) - Number(b));

  return {
    traits: variantOptions(
      traitIds,
      TRAIT_NAMES,
      "Trait",
      Boolean(raw["--"]) && traitIds.length > 0,
      "All traits",
    ),
    qualities: variantOptions(
      qualityIds,
      QUALITY_NAMES,
      "Quality",
      Boolean(selectedTrait["--"]) && qualityIds.length > 0,
      "All qualities",
    ),
  };
};

const priceToStats = (
  price: VariantPriceType,
  qualities: Record<string, VariantPriceType>,
): SalesRollupType => ({
  averageUnitPrice: price.average,
  commonQuantity: price.commonQuantity,
  commonUnitPriceRangeLower: price.minimum,
  commonUnitPriceRangeUpper: price.maximum,
  date: price.date,
  maximumUnitPrice: price.maximum,
  medianUnitPrice: (price.minimum + price.maximum) / 2,
  minimumUnitPrice: price.minimum,
  numberOfQualitiesTracked: Object.keys(qualities).filter(
    (qualityId) => qualityId !== "--",
  ).length,
  whiteAverageUnitPrice: qualities["01"]?.average,
  greenAverageUnitPrice: qualities["02"]?.average,
  blueAverageUnitPrice: qualities["03"]?.average,
  purpleAverageUnitPrice: qualities["04"]?.average,
  goldAverageUnitPrice: qualities["05"]?.average,
});

export const getItemVariantStats = (
  raw: TradableItemType["raw"],
  traitId = "--",
  qualityId = "--",
) => {
  const qualities = raw?.[traitId];
  const price = qualities?.[qualityId];
  return price && qualities ? priceToStats(price, qualities) : null;
};

/**
 * Converts compact pricing keys into display labels for the item header.
 */
export const getItemVariantMetadata = (
  raw: TradableItemType["raw"],
): ItemVariantMetadata => {
  if (!raw) return { traits: [], qualities: [] };

  const traitIds = Object.keys(raw)
    .filter((id) => id !== "--")
    .sort((a, b) => Number(a) - Number(b));
  const qualityIds = unique(
    Object.values(raw).flatMap((qualities) =>
      Object.keys(qualities).filter((id) => id !== "--"),
    ),
  ).sort((a, b) => Number(a) - Number(b));

  const traits = unique(
    traitIds.map((id) => variantName(id, TRAIT_NAMES, "Trait")),
  );
  const qualities = unique(
    qualityIds.map((id) => variantName(id, QUALITY_NAMES, "Quality")),
  );
  const hasAllTraits = Boolean(raw["--"]);
  const hasAllQualities = Object.values(raw).some(
    (qualityMap) => qualityMap["--"],
  );

  return {
    traits: traits.length && hasAllTraits ? ["All", ...traits] : traits,
    qualities:
      qualities.length && hasAllQualities ? ["All", ...qualities] : qualities,
  };
};
