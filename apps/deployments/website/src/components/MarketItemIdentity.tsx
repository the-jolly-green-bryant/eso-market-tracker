import { TradableItemType } from "../models/tradable-item-types";
import { getItemVariantMetadata } from "../item-variants";
import { PLATFORMS, MarketPlatform } from "../platform";
import LocalImage from "./LocalImage";
import PlaceholderImage from "./PlaceholderImage";
import "./MarketItemIdentity.scss";

type MarketItemIdentityProps = {
  item: TradableItemType;
  platform: MarketPlatform;
};

const MarketItemIdentity = ({ item, platform }: MarketItemIdentityProps) => {
  const { traits, qualities } = getItemVariantMetadata(item.raw);

  return (
    <div className="market-item-identity">
      <div className="market-item-image">
        {item.imageLink ? (
          <LocalImage imageUrl={item.imageLink} />
        ) : (
          <PlaceholderImage isMissing />
        )}
      </div>

      <div className="market-item-identity-heading">
        <span className="market-item-eyebrow">
          {PLATFORMS[platform]} market value
        </span>
        <h1>{item.displayLabel}</h1>
      </div>

      {(traits.length > 0 || qualities.length > 0) && (
        <dl className="market-item-variants">
          {traits.length > 0 && (
            <div>
              <dt>Traits:</dt>
              <dd>{traits.join(", ")}</dd>
            </div>
          )}
          {qualities.length > 0 && (
            <div>
              <dt>Qualities:</dt>
              <dd>{qualities.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}

      <p>{item.description || "Console market pricing and history."}</p>
    </div>
  );
};

export default MarketItemIdentity;
