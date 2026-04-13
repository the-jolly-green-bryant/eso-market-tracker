import { useQuery } from '@apollo/client'
import { IonMenu, IonMenuToggle, IonIcon } from '@ionic/react'
import { chevronForwardOutline } from 'ionicons/icons'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'

import './NavigationMenu.scss'
import * as constants from '../constants'
import * as routes from '../routes'
import * as queries from '../models/queries'
import { TradableItemCategoryReferenceType } from '../models/tradable-item-types'
import { CATEGORIES } from '../constants'

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

export type RepoStats = {
  lastUpdated: string
  byServer: Record<string, number>
  totalItemsAllServers: number
}

export const __fetchEsoMarketTrackerStats = async (): Promise<RepoStats> => {
  const url =
    'https://raw.githubusercontent.com/the-jolly-green-bryant/eso-market-tracker/refs/heads/main/README.md'

  const r = await fetch(url)

  if (!r.ok) {
    throw new Error(`Failed to fetch README: ${r.status}`)
  }

  const text = await r.text()

  const lastUpdatedMatch = text.match(
    /Last Updated:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/m
  )
  if (!lastUpdatedMatch) {
    throw new Error('Could not find "Last Updated" in README')
  }

  const serverMatches = [
    ...text.matchAll(/(XBOX-NA|XBOX-EU|PS-NA|PS-EU)\s+|\s+(\d+?)\s+/gm),
  ]

  if (!serverMatches.length) {
    throw new Error('Could not find server item counts in README')
  }

  const totalItemsAllServers = serverMatches.reduce(
    (acc, cur) => acc + Number.parseInt(cur[2] ?? 0),
    0
  )

  return {
    lastUpdated: lastUpdatedMatch[1],
    totalItemsAllServers,
  }
}

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
          <Link
            to={{ pathname: 'https://data.esomarkettracker.com' }}
            target="_blank"
          >
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

type AppStatsType = {
  appStats: {
    transactionCount: number
    itemCount: number
    latestTransactionDate: string
  }
}

export default () => {
  const menuRef = useRef<HTMLIonMenuElement>(null)
  const { data: appStatsData } = useQuery<AppStatsType>(queries.GET_APP_STATS)
  const [updateDate, setUpdateDate] = useState<string>()
  const [tracked, setTracked] = useState<number>()

  void __fetchEsoMarketTrackerStats().then(
    ({ lastUpdated, totalItemsAllServers }) => (
      setUpdateDate(lastUpdated), setTracked(totalItemsAllServers)
    )
  )

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
                  Last Updated: {updateDate}
                </Link>
              </IonMenuToggle>
            </div>

            <div className="navigation-menu-section-item">
              <IonMenuToggle autoHide={false}>
                <Link to={{ pathname: routes.appStats() }}>
                  Unique Items: {tracked && tracked.toLocaleString()}
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
