import { IonIcon } from '@ionic/react'
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
import * as routes from '../routes'
import { trackSearch } from '../analytics'
import { __useSearch } from './useItem'
import './Dashboard.scss'
import { MARKET_STATS } from '../marketStats'
import MarketHeader from '../components/MarketHeader'
import MarketInsights from '../components/MarketInsights'
import SupportBanner from '../components/SupportBanner'
import ExternalLink from '../components/ExternalLink'

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
    href: routes.apiDocs(),
    icon: codeSlashOutline,
    action: 'Read the API',
  },
  {
    title: 'Install the add-on',
    description: 'Install the unified TSC2 price checker for console markets.',
    href: 'https://tamrielsavings.com/price-fetcher',
    icon: cubeOutline,
    action: 'Get TSC2',
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

const AccessCard = ({ card }: { card: (typeof accessCards)[number] }) => {
  const content = (
    <>
      <IonIcon className="market-access-icon" icon={card.icon} />
      <strong>{card.title}</strong>
      <p>{card.description}</p>
      <span>{card.action} →</span>
    </>
  )

  return card.href.startsWith('http') ? (
    <ExternalLink className="market-access-card" href={card.href}>
      {content}
    </ExternalLink>
  ) : (
    <Link className="market-access-card" to={card.href}>
      {content}
    </Link>
  )
}

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
  searchInputRef,
  children,
}: {
  text?: string
  onPerformSearch: (text: string) => void
  searchInputRef: React.RefObject<HTMLInputElement>
  children?: React.ReactNode
}) => (
  <section className={`market-hero${children ? ' is-searching' : ''}`}>
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
          inputRef={searchInputRef}
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
          ),
        )}
      </div>

      {children && <div className="market-hero-results">{children}</div>}
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
    <MarketInsights />

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
          <AccessCard card={card} key={card.title} />
        ))}
      </div>
    </section>

    <section className="market-seo-intro">
      <span>ESO console price checker</span>
      <h2>Check what items are worth before you trade</h2>
      <p>
        Search current Elder Scrolls Online market values for Xbox and
        PlayStation, from Dreugh Wax and Kuta to furnishing plans, motifs, gear,
        and materials. ESO Market Tracker provides public price history and
        recent console market observations for more than{' '}
        {MARKET_STATS.trackedItems.toLocaleString()} items.
      </p>
      <p>
        Looking for Tamriel Savings Co, the TSC price checker, or SavageTSC?{' '}
        <Link to={routes.tamrielSavingsAlternative()}>
          Compare the independent ESO Market Tracker alternative.
        </Link>
      </p>
    </section>
  </>
)

// eslint-disable-next-line max-lines-per-function
export default () => {
  const { text } = useParams<{ text: string | undefined }>()
  const searchInputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => {
    const focusSearch = (event: globalThis.KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'k' ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return
      }

      event.preventDefault()
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  return (
    <div className="market-home">
      <Helmet>
        <title>ESO Price Checker for Xbox & PlayStation | Market Tracker</title>
        <meta
          name="description"
          content="Check ESO prices for Xbox and PlayStation. Search current market values, price observations, and history for Dreugh Wax, Kuta, motifs, gear, and 44,000+ items."
        />
        <link rel="canonical" href="https://esomarkettracker.com/dashboard/" />
        <meta
          property="og:title"
          content="ESO Price Checker for Xbox & PlayStation"
        />
        <meta
          property="og:description"
          content="Search current console prices and market history for more than 44,000 Elder Scrolls Online items."
        />
        <meta
          property="og:url"
          content="https://esomarkettracker.com/dashboard/"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebSite',
                name: 'ESO Market Tracker',
                alternateName: 'ESO Price Checker',
                url: 'https://esomarkettracker.com/',
                potentialAction: {
                  '@type': 'SearchAction',
                  target:
                    'https://esomarkettracker.com/dashboard/{search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@type': 'WebApplication',
                name: 'ESO Market Tracker',
                applicationCategory: 'GameApplication',
                operatingSystem: 'Web',
                url: 'https://esomarkettracker.com/dashboard/',
                description:
                  'An Elder Scrolls Online console market tracker and price checker for Xbox and PlayStation.',
              },
            ],
          })}
        </script>
      </Helmet>

      <MarketHeader />

      <main className="market-home-scroll">
        <Hero
          text={text}
          onPerformSearch={onPerformSearch}
          searchInputRef={searchInputRef}
        >
          {currentSearch ? (
            <SearchResults
              currentSearch={currentSearch}
              loading={loading}
              error={error}
              data={data}
            />
          ) : undefined}
        </Hero>

        <div className="market-content">
          <ProofBar />

          {!currentSearch && <DefaultContent />}
        </div>

        <footer className="market-footer">
          <SupportBanner />
        </footer>
      </main>
    </div>
  )
}
