import { useQuery } from '@apollo/client'
import { IonMenu, IonMenuToggle, IonIcon } from '@ionic/react'
import { chevronForwardOutline } from 'ionicons/icons'
import { useRef } from 'react'
import { Link } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'

import './NavigationMenu.scss'
import * as constants from '../constants'
import * as routes from '../routes'
import * as queries from '../models/queries'
import { TradableItemCategoryReferenceType } from '../models/tradable-item-types'

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

const renderCategories = (categoriesData: CategoriesType) => (
  <div>
    {categoriesData &&
      categoriesData.tradableItemCategories.map((category, index: number) => (
        <div className="navigation-menu-section-item" key={`category_${index}`}>
          <IonMenuToggle autoHide={false}>
            <Link
              to={{
                pathname: routes.getCategory(category.slug),
                state: { categoryReference: category },
              }}
            >
              <div className="navigation-menu-section-item-label">
                {category.displayLabel}
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

type AppStatsType = {
  appStats: {
    transactionCount: number
    itemCount: number
    latestTransactionDate: string
  }
}

type CategoriesType = {
  tradableItemCategories: TradableItemCategoryReferenceType[]
}

export default () => {
  const menuRef = useRef<HTMLIonMenuElement>(null)
  const {
    loading,
    error,
    data: categoriesData,
  } = useQuery<CategoriesType>(queries.GET_CATEGORIES)

  const { data: appStatsData } = useQuery<AppStatsType>(queries.GET_APP_STATS)

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
                  Last Updated: {new Date().toISOString().split('T')[0]}
                </Link>
              </IonMenuToggle>
            </div>

            <div className="navigation-menu-section-item">
              <IonMenuToggle autoHide={false}>
                <Link to={{ pathname: routes.appStats() }}>
                  Unique Items:{' '}
                  {appStatsData &&
                    appStatsData.appStats.itemCount.toLocaleString()}
                </Link>
              </IonMenuToggle>
            </div>

            <div className="navigation-menu-section-item">
              <IonMenuToggle autoHide={false}>
                <Link to={{ pathname: routes.appStats() }}>
                  Total Sales:{' '}
                  {appStatsData &&
                    appStatsData.appStats.transactionCount.toLocaleString()}
                </Link>
              </IonMenuToggle>
            </div>
          </div>
        </div>

        <div className="navigation-menu-section">
          <div className="navigation-menu-section-label">
            Browse by Category
          </div>

          <div className="navigation-menu-section-item-container">
            {loading && <LoadingSkeleton error={false} />}
            {error && <LoadingSkeleton error={true} />}
            {!loading &&
              !error &&
              categoriesData &&
              renderCategories(categoriesData)}
          </div>
        </div>

        {ABOUT_CONTENT}
      </div>
    </IonMenu>
  )
}
