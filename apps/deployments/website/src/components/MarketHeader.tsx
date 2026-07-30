import { IonMenuButton } from '@ionic/react'
import { Link } from 'react-router-dom'

import { PLATFORMS, MarketPlatform, usePlatform } from '../platform'
import * as routes from '../routes'
import './MarketHeader.scss'

export default () => {
  const { platform, setPlatform } = usePlatform()

  return (
    <header className="market-header">
      <Link className="market-brand" to={`${routes.dashboard()}/`}>
        <span className="market-brand-mark">✦</span>
        <span>ESO Market Tracker</span>
      </Link>

      <nav className="market-nav" aria-label="Primary navigation">
        <Link to={`${routes.dashboard()}/`}>Market</Link>
        <Link to={routes.categories()}>Categories</Link>
        <Link to={routes.apiDocs()}>API</Link>
        <a
          className="market-nav-external"
          href="https://github.com/the-jolly-green-bryant/eso-market-tracker/releases/tag/latest"
          target="_blank"
          rel="noopener noreferrer"
        >
          Data <span aria-hidden="true">↗</span>
        </a>
        <a
          className="market-nav-external"
          href="https://github.com/the-jolly-green-bryant/eso-market-tracker"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <div className="market-header-actions">
        <label className="market-platform">
          <span className="sr-only">Market platform</span>
          <select
            aria-label="Market platform"
            value={platform}
            onChange={(event) =>
              setPlatform(event.target.value as MarketPlatform)
            }
          >
            {Object.entries(PLATFORMS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="market-status">
          <span />
          Data current
        </div>
      </div>

      <div className="market-mobile-menu">
        <IonMenuButton />
      </div>
    </header>
  )
}
