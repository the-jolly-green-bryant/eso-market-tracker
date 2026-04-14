import FlatButton from '../components/FlatButton'

const TradableItemReferenceSkeleton: React.FC = () => (
  <div className="tradable-item-reference">
    <FlatButton className="skeleton-loader-background">
      <div className="tradable-item-reference-label-container">
        <div className="tradable-item-reference-label skeleton-loader-item">
          PLACEHOLDER_LABEL
        </div>

        <div className="tradable-item-reference-price skeleton-loader-item">
          PLACEHOLDER_AVERAGE
        </div>

        <div className="tradable-item-reference-sales skeleton-loader-item">
          PLACEHOLDER_SALES
        </div>
      </div>

      <div className="tradable-item-reference-image skeleton-loader-item">
        {/*Image Here*/}
      </div>
    </FlatButton>
  </div>
)

export default TradableItemReferenceSkeleton
