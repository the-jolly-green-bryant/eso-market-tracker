import { TradableItemType } from "../models/tradable-item-types";
import { ItemVariantOption } from "../item-variants";
import { PLATFORMS, MarketPlatform } from "../platform";
import LocalImage from "./LocalImage";
import PlaceholderImage from "./PlaceholderImage";
import "./MarketItemIdentity.scss";

type MarketItemIdentityProps = {
  item: TradableItemType;
  onQualityChange: (qualityId: string) => void;
  onTraitChange: (traitId: string) => void;
  platform: MarketPlatform;
  qualities: ItemVariantOption[];
  qualityId: string;
  traits: ItemVariantOption[];
  traitId: string;
};

const MarketItemIdentity = ({
  item,
  onQualityChange,
  onTraitChange,
  platform,
  qualities,
  qualityId,
  traits,
  traitId,
}: MarketItemIdentityProps) => (
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

    {(traits.length > 1 || qualities.length > 1) && (
      <div className="market-item-variants" aria-label="Item variants">
        {traits.length > 1 && (
          <label>
            <span>Trait</span>
            <select
              aria-label="Item trait"
              value={traitId}
              onChange={(event) => onTraitChange(event.target.value)}
            >
              {traits.map((trait) => (
                <option key={trait.id} value={trait.id}>
                  {trait.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {qualities.length > 1 && (
          <label>
            <span>Quality</span>
            <select
              aria-label="Item quality"
              value={qualityId}
              onChange={(event) => onQualityChange(event.target.value)}
            >
              {qualities.map((quality) => (
                <option key={quality.id} value={quality.id}>
                  {quality.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    )}

    <p>{item.description || "Console market pricing and history."}</p>
  </div>
);

export default MarketItemIdentity;
