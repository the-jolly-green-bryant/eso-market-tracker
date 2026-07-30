import { IonIcon } from '@ionic/react'
import {
  removeOutline,
  addOutline,
  swapHorizontalOutline,
  fileTrayStackedOutline,
  cashOutline,
} from 'ionicons/icons'
import './TradableItem.scss'

const CONTENT = (
  <div className="tradable-item skeleton-loader-background">
    <div className="tradable-item-header">
      <div className="tradable-item-header-title skeleton-loader-item">
        Avg. Price
      </div>

      <div className="tradable-item-header-price skeleton-loader-item">
        0000
      </div>

      <div className="tradable-item-header-date skeleton-loader-item">
        AS_OF_CURRENT_DATE
      </div>

      <div className="tradable-item-header-graph"></div>

      <div className="tradable-item-header-graph-toggle-container">&nbsp;</div>
    </div>

    <div className="tradable-item-content skeleton-loader-background is-inverted">
      <div className="tradable-item-content-header">
        <div className="tradable-item-content-header-text">
          <div className="tradable-item-content-header-category skeleton-loader-item is-inverted">
            CATEGORY
          </div>

          <div className="tradable-item-content-header-title skeleton-loader-item is-inverted">
            DISPLAY_LABEL
          </div>
        </div>
        <div className="tradable-item-content-header-image skeleton-loader-item is-inverted">
          {/*Image Here*/}
        </div>
      </div>
      <div className="tradable-item-content-section">
        <div className="tradable-item-content-section-column">
          <div className="tradable-item-stat-container">
            <div className="tradable-item-stat-icon">
              <IonIcon icon={removeOutline}></IonIcon>
            </div>
            <div className="tradable-item-stat-label skeleton-loader-item is-inverted">
              Minimum
            </div>

            <div className="tradable-item-stat-value skeleton-loader-item is-inverted">
              0000
            </div>
          </div>

          <div className="tradable-item-stat-container">
            <div className="tradable-item-stat-icon">
              <IonIcon icon={addOutline}></IonIcon>
            </div>
            <div className="tradable-item-stat-label skeleton-loader-item is-inverted">
              Maximum
            </div>

            <div className="tradable-item-stat-value skeleton-loader-item is-inverted">
              0000
            </div>
          </div>
        </div>

        <div className="tradable-item-content-section-column">
          <div className="tradable-item-stat-container">
            <div className="tradable-item-stat-icon">
              <IonIcon icon={fileTrayStackedOutline}></IonIcon>
            </div>
            <div className="tradable-item-stat-label skeleton-loader-item is-inverted">
              Common Stack Size
            </div>

            <div className="tradable-item-stat-value skeleton-loader-item is-inverted">
              000
            </div>
          </div>

          <div className="tradable-item-stat-container">
            <div className="tradable-item-stat-icon">
              <IonIcon icon={cashOutline}></IonIcon>
            </div>
            <div className="tradable-item-stat-label skeleton-loader-item is-inverted">
              Break Even
            </div>

            <div className="tradable-item-stat-value skeleton-loader-item is-inverted">
              0000
            </div>
          </div>
        </div>
      </div>

      <div className="tradable-item-stat-container">
        <div className="tradable-item-stat-icon">
          <IonIcon icon={swapHorizontalOutline}></IonIcon>
        </div>
        <div className="tradable-item-stat-label skeleton-loader-item is-inverted">
          Common Range
        </div>

        <div className="tradable-item-stat-value skeleton-loader-item is-inverted">
          000000 - 000000
        </div>
      </div>
    </div>
  </div>
)

const TradableItemSkeleton: React.FC = () => CONTENT

export default TradableItemSkeleton
