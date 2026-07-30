import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'

import * as routes from '../routes'
import { MARKET_STATS } from '../marketStats'
import ExternalLink from '../components/ExternalLink'
import MarketHeader from '../components/MarketHeader'
import './TamrielSavingsAlternative.scss'

const canonicalUrl =
  'https://esomarkettracker.com/tamriel-savings-price-checker'
const title =
  'Tamriel Savings & TSC Price Checker Alternative | ESO Market Tracker'
const description =
  'Looking for Tamriel Savings Co, TSC, or SavageTSC? Compare an independent ESO console price checker with public Xbox and PlayStation market data.'

// eslint-disable-next-line max-lines-per-function
export default () => (
  <div className="tsc-alternative">
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          url: canonicalUrl,
          description,
          isPartOf: {
            '@type': 'WebSite',
            name: 'ESO Market Tracker',
            url: 'https://esomarkettracker.com/',
          },
        })}
      </script>
    </Helmet>

    <MarketHeader />

    <main>
      <div className="tsc-alternative-kicker">
        Independent ESO console market data
      </div>
      <h1>Looking for Tamriel Savings or the TSC price checker?</h1>
      <p className="tsc-alternative-lead">
        ESO Market Tracker is an independent alternative for checking Elder
        Scrolls Online prices across Xbox and PlayStation. Search{' '}
        {MARKET_STATS.trackedItems.toLocaleString()} items, inspect recent
        market history, or download the public dataset.
      </p>

      <div className="tsc-alternative-actions">
        <Link to={`${routes.dashboard()}/`}>Open the ESO price checker</Link>
        <ExternalLink href="https://tamrielsavings.com/">
          Visit official Tamriel Savings
        </ExternalLink>
      </div>

      <section>
        <h2>Tamriel Savings Co, TSC, and SavageTSC</h2>
        <p>
          Tamriel Savings Co is commonly called TSC, and SavageTSC is associated
          with that community project. ESO Market Tracker is not Tamriel
          Savings Co and does not claim affiliation. This page helps players
          who searched for those names understand that another public console
          market tracker is available.
        </p>
      </section>

      <section>
        <h2>What ESO Market Tracker provides</h2>
        <ul>
          <li>Searchable Xbox and PlayStation item prices</li>
          <li>Recent sale ranges and historical market observations</li>
          <li>Public, versioned data and a downloadable SQLite database</li>
          <li>An API, website, and in-game add-on backed by one dataset</li>
        </ul>
      </section>

      <section>
        <h2>Start with a popular ESO price check</h2>
        <div className="tsc-alternative-items">
          {['Dreugh Wax', 'Kuta', 'Perfect Roe', 'Tempering Alloy'].map(
            (item) => (
              <Link key={item} to={routes.getItem(item)}>
                {item} price
              </Link>
            )
          )}
        </div>
      </section>
    </main>
  </div>
)
