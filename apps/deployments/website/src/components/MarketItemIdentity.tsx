import { TradableItemType } from '../models/tradable-item-types'
import { PLATFORMS, MarketPlatform } from '../platform'
import LocalImage from './LocalImage'
import PlaceholderImage from './PlaceholderImage'
import './MarketItemIdentity.scss'

type MarketItemIdentityProps = {
  item: TradableItemType
  platform: MarketPlatform
}

const MarketItemIdentity = ({
  item,
  platform,
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

    <p>{item.description || 'Console market pricing and history.'}</p>
  </div>
)

export default MarketItemIdentity
