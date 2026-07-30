import {
  IonIcon,
  IonMenuButton,
} from '@ionic/react'
import {
  analyticsOutline,
  checkmarkCircle,
  codeSlashOutline,
  cubeOutline,
  logoGithub,
  pulseOutline,
  searchOutline,
  serverOutline,
  timeOutline,
} from 'ionicons/icons'
import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Link, useHistory, useParams } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import SearchBar from '../components/SearchBar'
import TopSoldItems from '../components/TopSoldItems'
import TradableItemList from '../components/TradableItemList'
import { ERROR_STATE, LOADING_STATE } from '../components/common'
import * as constants from '../constants'
import * as routes from '../routes'
import { trackSearch } from '../analytics'
import { __useSearch } from './useItem'
import './Dashboard.scss'
import { MARKET_STATS } from '../marketStats'

const accessCards = [
  {
    title: 'The website',
    description: 'Real-time console prices, history, and market intelligence.',
    href: 'https://www.esomarkettracker.com',
    icon: analyticsOutline,
    action: 'Open tracker',
  },
  {
    title: 'Explore the API',
    description: 'Programmatic access to normalized pricing and item data.',
    href: 'https://data.esomarkettracker.com',
    icon: codeSlashOutline,
    action: 'Read the API',
  },
  {
    title: 'Install the add-on',
    description: 'Bring market guidance directly into your ESO experience.',
    href: 'https://mods.bethesda.net/en/elderscrollsonline/details/34e80603-bb75-4802-afba-3f14e07fece5/BETA___Market_Tracker___Guild_Pricing_Assistant',
    icon: cubeOutline,
    action: 'Get the add-on',
  },
  {
    title: 'Data access',
    description: 'Download the public dataset and rolling SQLite release.',
    href: 'https://github.com/the-jolly-green-bryant/eso-market-tracker/releases/tag/latest',
    icon: serverOutline,
    action: 'Download data',
  },
  {
    title: 'GitHub',
    description: 'Inspect the source, pipeline, history, and methodology.',
    href: 'https://github.com/the-jolly-green-bryant/eso-market-tracker',
    icon: logoGithub,
    action: 'Browse source',
  },
]

const proofStats = [
  {
    value: MARKET_STATS.trackedItems.toLocaleString(),
    label: 'tracked items',
    icon: serverOutline,
  },
  {
    value: MARKET_STATS.pricingRecords.toLocaleString(),
    label: 'pricing records',
    icon: analyticsOutline,
  },
  {
    value: MARKET_STATS.observations.toLocaleString(),
    label: 'observations',
    icon: pulseOutline,
  },
  {
    value: MARKET_STATS.consoleMarkets.toLocaleString(),
    label: 'console markets',
    icon: cubeOutline,
  },
  { value: 'Daily', label: 'data refresh', icon: timeOutline },
]

const NoResults = () => (
  <div className="market-search-state">
    <LoadingSkeleton
      error={false}
      loading={false}
      title="No matching items"
      message="Try another item name, material, furnishing plan, or gear set."
    />
  </div>
)

const useSearch = (text?: string) => {
  const history = useHistory()
  const abortController = useRef<AbortController>()
  const [currentSearch, setCurrentSearch] = useState(text || '')
  const { loading, error, data } = __useSearch(currentSearch)

  const onPerformSearch = (searchText: string) => {
    const trimmed = searchText.trim()
    const newPath = trimmed
      ? routes.getSearchResults(trimmed)
      : `${routes.dashboard()}/`
    if (history.location.pathname !== newPath) history.replace(newPath)
    setCurrentSearch(trimmed)
    abortController.current?.abort()
    abortController.current = new window.AbortController()
  }

  return { loading, error, data, onPerformSearch, currentSearch }
}

const Header = () => (
  <header className="market-header">
    <Link className="market-brand" to={`${routes.dashboard()}/`}>
      <span className="market-brand-mark">✦</span>
      <span>ESO Market Tracker</span>
    </Link>

    <nav className="market-nav" aria-label="Primary navigation">
      <Link to={`${routes.dashboard()}/`}>Market</Link>
      <Link to={routes.categories()}>Categories</Link>
      <a href="https://data.esomarkettracker.com">API</a>
      <a href="https://github.com/the-jolly-green-bryant/eso-market-tracker/releases/tag/latest">
        Data
      </a>
      <a href="https://github.com/the-jolly-green-bryant/eso-market-tracker">
        GitHub
      </a>
    </nav>

    <div className="market-header-actions">
      <div className="market-platform">Xbox NA</div>
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

const ProofBar = () => (
  <section className="market-proof" aria-label="Dataset coverage">
    {proofStats.map(({ value, label, icon }) => (
      <div className="market-proof-stat" key={label}>
        <IonIcon icon={icon} />
        <div>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      </div>
    ))}
  </section>
)

const Hero = ({
  text,
  onPerformSearch,
}: {
  text?: string
  onPerformSearch: (text: string) => void
}) => (
  <section className="market-hero">
    <div className="market-hero-art" aria-hidden="true" />
    <div className="market-hero-content">
      <div className="market-kicker">
        <IonIcon icon={checkmarkCircle} />
        Definitive console market intelligence
      </div>
      <h1>Know what it’s worth.</h1>
      <p>
        Search public, versioned pricing across Xbox and PlayStation. Built for
        traders who would rather know than guess.
      </p>

      <div className="market-command-search">
        <IonIcon icon={searchOutline} />
        <SearchBar
          text={text}
          searchCallback={onPerformSearch}
          onClear={() => onPerformSearch('')}
          placeholderText={`Search ${MARKET_STATS.trackedItems.toLocaleString()} console items`}
        />
        <kbd>⌘ K</kbd>
      </div>

      <div className="market-popular">
        <span>Popular</span>
        {['Kuta', 'Dreugh Wax', 'Perfect Roe', 'Tempering Alloy'].map(
          (item) => (
            <button key={item} onClick={() => onPerformSearch(item)}>
              {item}
            </button>
          )
        )}
      </div>
    </div>
  </section>
)

const SearchResults = ({
  currentSearch,
  loading,
  error,
  data,
}: {
  currentSearch: string
  loading: boolean
  error: Error | null
  data: ReturnType<typeof __useSearch>['data']
}) => (
  <section className="market-results">
    <div className="market-section-heading">
      <div>
        <span>Search results</span>
        <h2>“{currentSearch}”</h2>
      </div>
      {!loading && <strong>{data.length.toLocaleString()} matches</strong>}
    </div>
    {loading && LOADING_STATE}
    {error && ERROR_STATE}
    {!loading && !error && data.length > 0 && <TradableItemList items={data} />}
    {!loading && !error && !data.length && <NoResults />}
  </section>
)

const DefaultContent = () => (
  <>
    <section className="market-snapshot">
      <div className="market-section-heading">
        <div>
          <span>Market snapshot</span>
          <h2>Gold materials</h2>
        </div>
        <Link to={routes.getCategory('Mats (Gold)')}>View category →</Link>
      </div>
      <TopSoldItems />
    </section>

    <section className="market-access">
      <div className="market-section-heading">
        <div>
          <span>One dataset, every surface</span>
          <h2>Power your edge</h2>
        </div>
      </div>
      <div className="market-access-grid">
        {accessCards.map((card) => (
          <a href={card.href} key={card.title}>
            <IonIcon icon={card.icon} />
            <strong>{card.title}</strong>
            <p>{card.description}</p>
            <span>{card.action} →</span>
          </a>
        ))}
      </div>
    </section>
  </>
)

export default () => {
  const { text } = useParams<{ text: string | undefined }>()
  const { loading, error, data, onPerformSearch, currentSearch } =
    useSearch(text)

  useEffect(() => {
    if (text) onPerformSearch(text)
  }, [])

  useEffect(() => {
    if (currentSearch && data && !loading && !error) {
      trackSearch(currentSearch, data.length)
    }
  }, [currentSearch, data, loading, error])

  return (
    <div className="market-home">
      <Helmet>
        <title>{constants.getFullPageTitle('Console Market Intelligence')}</title>
        <meta
          name="description"
          content="Search definitive Xbox and PlayStation pricing for more than 44,000 Elder Scrolls Online items."
        />
      </Helmet>

      <Header />

      <main className="market-home-scroll">
        <Hero text={text} onPerformSearch={onPerformSearch} />

        <div className="market-content">
          <ProofBar />

          {currentSearch ? (
            <SearchResults
              currentSearch={currentSearch}
              loading={loading}
              error={error}
              data={data}
            />
          ) : (
            <DefaultContent />
          )}
        </div>

        <footer className="market-footer">
          <span>ESO Market Tracker</span>
          <p>
            Public data. Transparent methodology. Built for the ESO community.
          </p>
          <a href={constants.PATREON_LINK}>Join the Discord</a>
          <a href={routes.privacyPolicy()}>Privacy</a>
        </footer>
      </main>
    </div>
  )
}
