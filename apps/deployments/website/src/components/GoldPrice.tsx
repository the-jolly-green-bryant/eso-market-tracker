import "./GoldPrice.scss";

import { formatGoldValue, GOLD_ICON_URL } from "./gold-currency";

export const GoldIcon = () => (
  <img
    className="eso-gold-icon"
    src={GOLD_ICON_URL}
    alt=""
    aria-hidden="true"
  />
);

export const GoldPrice = ({
  value,
  prefix = "",
}: {
  value: number;
  prefix?: string;
}) => (
  <span className="eso-gold-price">
    <span aria-hidden="true">
      {prefix}
      {formatGoldValue(value)}
    </span>
    <GoldIcon />
    <span className="eso-gold-price-sr-only">
      {prefix}
      {formatGoldValue(value)} gold
    </span>
  </span>
);

export const GoldPriceRange = ({
  minimum,
  maximum,
}: {
  minimum: number;
  maximum: number;
}) => (
  <span className="eso-gold-price">
    <span aria-hidden="true">
      {formatGoldValue(minimum)}–{formatGoldValue(maximum)}
    </span>
    <GoldIcon />
    <span className="eso-gold-price-sr-only">
      {formatGoldValue(minimum)} to {formatGoldValue(maximum)} gold
    </span>
  </span>
);
