import { IonMenu, IonMenuToggle, IonIcon } from '@ionic/react'
import { chevronForwardOutline } from 'ionicons/icons'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import * as constants from '../constants'
import * as routes from '../routes'
import { CATEGORIES } from '../constants'
import { MARKET_STATS } from '../marketStats'

const HEADER_CONTENT = (
  <div className="navigation-menu-header">
    <div className="navigation-menu-header-image">
      <img src="assets/images/icon-marketing.png" alt="" />
    </div>

    <div className="navigation-menu-header-title">Fight. Loot. Profit.</div>

    <a
      className="navigation-menu-header-button"
      href={constants.PATREON_LINK}
      target="_blank"
    >
      Learn More
    </a>
  </div>
)

const ABOUT_CONTENT = (
  <div className="navigation-menu-section">
    <div className="navigation-menu-section-label">About Us &amp; More</div>

    <div className="navigation-menu-section-item-container">
      <div className="navigation-menu-section-item">
        <IonMenuToggle autoHide={false}>
          <Link to={{ pathname: routes.about() }}>About Us</Link>
        </IonMenuToggle>
      </div>

      <div className="navigation-menu-section-item">
        <IonMenuToggle autoHide={false}>
          <Link to={{ pathname: constants.REPORT_A_BUG_LINK }} target="_blank">
            Report a Bug
          </Link>
        </IonMenuToggle>
      </div>
    </div>
  </div>
)

const MORE_ACCESS = (
  <div className="navigation-menu-section">
    <div className="navigation-menu-section-label">More Ways to Access</div>

    <div className="navigation-menu-section-item-container">
      <div className="navigation-menu-section-item">
        <IonMenuToggle autoHide={false}>
          <Link
            to={{ pathname: 'https://www.esomarkettracker.com' }}
            target="_blank"
          >
            The Website
          </Link>
        </IonMenuToggle>
      </div>

      <div className="navigation-menu-section-item">
        <IonMenuToggle autoHide={false}>
          <Link to={routes.apiDocs()}>
            The API
          </Link>
        </IonMenuToggle>
      </div>

      <div className="navigation-menu-section-item">
        <IonMenuToggle autoHide={false}>
          <Link
            to={{
              pathname:
                'https://github.com/the-jolly-green-bryant/eso-market-tracker',
            }}
            target="_blank"
          >
            The Repo
          </Link>
        </IonMenuToggle>
      </div>

      <div className="navigation-menu-section-item">
        <IonMenuToggle autoHide={false}>
          <Link
            to={{
              pathname:
                'https://mods.bethesda.net/en/elderscrollsonline/details/34e80603-bb75-4802-afba-3f14e07fece5/BETA___Market_Tracker___Guild_Pricing_Assistant',
            }}
            target="_blank"
          >
            The Addon
          </Link>
        </IonMenuToggle>
      </div>
    </div>
  </div>
)

const renderCategories = () => (
  <div>
    {Object.keys(CATEGORIES)
      .sort((a, b) => a.localeCompare(b))
      .map((category, index: number) => (
        <div className="navigation-menu-section-item" key={`category_${index}`}>
          <IonMenuToggle autoHide={false}>
            <Link
              to={{
                pathname: routes.getCategory(category),
              }}
            >
              <div className="navigation-menu-section-item-label">
                {category}
              </div>

              <div className="navigation-menu-section-item-icon">
                <IonIcon icon={chevronForwardOutline}></IonIcon>
              </div>
            </Link>
          </IonMenuToggle>
        </div>
      ))}
  </div>
)

export default () => {
  const menuRef = useRef<HTMLIonMenuElement>(null)

  return (
    <IonMenu contentId="main" type="push" ref={menuRef} swipeGesture={false}>
      <div className="navigation-menu">
        {HEADER_CONTENT}

        <div className="navigation-menu-section">
          <div className="navigation-menu-section-label">Stats</div>

          <div className="navigation-menu-section-item-container">
            <div className="navigation-menu-section-item">
              <IonMenuToggle autoHide={false}>
                <Link to={{ pathname: routes.appStats() }}>
                  Last Updated: {MARKET_STATS.lastUpdated}
                </Link>
              </IonMenuToggle>
            </div>

            <div className="navigation-menu-section-item">
              <IonMenuToggle autoHide={false}>
                <Link to={{ pathname: routes.appStats() }}>
                  Unique Items: {MARKET_STATS.trackedItems.toLocaleString()}
                </Link>
              </IonMenuToggle>
            </div>
          </div>
        </div>

        {MORE_ACCESS}

        <div className="navigation-menu-section">
          <div className="navigation-menu-section-label">
            Browse by Category
          </div>

          <div className="navigation-menu-section-item-container">
            {renderCategories()}
          </div>
        </div>

        {ABOUT_CONTENT}
      </div>
    </IonMenu>
  )
}
