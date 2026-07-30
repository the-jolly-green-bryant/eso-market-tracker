import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { PLATFORMS, MarketPlatform, usePlatform } from '../platform'
import * as routes from '../routes'
import ExternalLink from './ExternalLink'
import './MarketHeader.scss'

const isPathActive = (pathname: string, ...prefixes: string[]) =>
  prefixes.some((prefix) => pathname.startsWith(prefix))

const InternalLinks = ({ pathname }: { pathname: string }) => (
  <>
    <Link
      className={
        isPathActive(pathname, routes.dashboard(), routes.item())
          ? 'is-active'
          : ''
      }
      to={`${routes.dashboard()}/`}
    >
      Market
    </Link>
    <Link
      className={
        isPathActive(pathname, routes.categories(), routes.category())
          ? 'is-active'
          : ''
      }
      to={routes.categories()}
    >
      Categories
    </Link>
    <Link
      className={isPathActive(pathname, routes.apiDocs()) ? 'is-active' : ''}
      to={routes.apiDocs()}
    >
      API
    </Link>
  </>
)

const ExternalLinks = () => (
  <>
    <ExternalLink
      className="market-nav-external"
      href="https://github.com/the-jolly-green-bryant/eso-market-tracker/releases/tag/latest"
    >
      Data
    </ExternalLink>
    <ExternalLink
      className="market-nav-external"
      href="https://github.com/the-jolly-green-bryant/eso-market-tracker"
    >
      GitHub
    </ExternalLink>
  </>
)

export default () => {
  const { platform, setPlatform } = usePlatform()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <header className="market-header">
      <Link className="market-brand" to={`${routes.dashboard()}/`}>
        <img
          className="market-brand-mark"
          src="/assets/images/market-tracker-brand-gold.png"
          alt=""
        />
        <span>ESO Market Tracker</span>
      </Link>

      <nav className="market-nav" aria-label="Primary navigation">
        <InternalLinks pathname={location.pathname} />
        <ExternalLinks />
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

      <button
        className="market-mobile-menu"
        type="button"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {menuOpen && (
        <nav className="market-mobile-nav" aria-label="Mobile navigation">
          <InternalLinks pathname={location.pathname} />
          <div className="market-mobile-nav-divider" />
          <ExternalLinks />
        </nav>
      )}
    </header>
  )
}
