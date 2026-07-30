import { Helmet } from 'react-helmet'

import MarketHeader from '../components/MarketHeader'
import * as routes from '../routes'
import './ApiDocs.scss'

const BASE_URL = 'https://data.esomarkettracker.com'

const Code = ({ children }: { children: string }) => (
  <pre>
    <code>{children}</code>
  </pre>
)

const Endpoint = ({
  path,
  summary,
  children,
}: {
  path: string
  summary: string
  children: React.ReactNode
}) => (
  <article className="api-endpoint">
    <div className="api-endpoint-title">
      <span>GET</span>
      <code>{path}</code>
    </div>
    <p>{summary}</p>
    {children}
  </article>
)

// API concepts are intentionally presented in one continuous document.
// eslint-disable-next-line max-lines-per-function
export default () => {
  const canonicalUrl = `https://esomarkettracker.com${routes.apiDocs()}`

  return (
    <div className="api-docs-page">
      <Helmet>
        <title>ESO Market Tracker API Documentation</title>
        <meta
          name="description"
          content="Use the free ESO Market Tracker API to search items and retrieve Xbox and PlayStation market prices."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <MarketHeader />

      <main className="api-docs-scroll">
        <div className="api-docs-shell">
          <header className="api-docs-hero">
            <span>Public market data API</span>
            <h1>Build on the market.</h1>
            <p>
              Search the ESO catalog and retrieve current console pricing from
              the same versioned data that powers ESO Market Tracker.
            </p>
            <div className="api-base-url">
              <small>Base URL</small>
              <code>{BASE_URL}</code>
            </div>
          </header>

          <section className="api-docs-layout">
            <nav className="api-docs-nav" aria-label="API documentation">
              <a href="#quick-start">Quick start</a>
              <a href="#endpoints">Endpoints</a>
              <a href="#platforms">Platforms</a>
              <a href="#responses">Response format</a>
            </nav>

            <div className="api-docs-content">
              <section id="quick-start">
                <div className="api-section-title">
                  <span>01</span>
                  <h2>Quick start</h2>
                </div>
                <p>
                  The API is read-only and requires no authentication. Item
                  keys returned by search can be passed directly to the item
                  endpoint.
                </p>
                <Code>{`curl "${BASE_URL}/search/dreugh%20wax"\n\ncurl "${BASE_URL}/item/1393740546"`}</Code>
              </section>

              <section id="endpoints">
                <div className="api-section-title">
                  <span>02</span>
                  <h2>Endpoints</h2>
                </div>
                <Endpoint
                  path="/search/:term"
                  summary="Find matching items by all or part of an item name."
                >
                  <p>
                    URL-encode the search term. The response contains item
                    references and pricing grouped by console megaserver.
                  </p>
                </Endpoint>
                <Endpoint
                  path="/item/:key"
                  summary="Retrieve item metadata and current pricing."
                >
                  <p>
                    Use the item key from a search result. Pricing is grouped
                    first by platform, then trait and quality.
                  </p>
                </Endpoint>
              </section>

              <section id="platforms">
                <div className="api-section-title">
                  <span>03</span>
                  <h2>Platform keys</h2>
                </div>
                <div className="api-platform-grid">
                  <div><code>xbox-na</code><span>Xbox North America</span></div>
                  <div><code>xbox-eu</code><span>Xbox Europe</span></div>
                  <div><code>ps-na</code><span>PlayStation North America</span></div>
                  <div><code>ps-eu</code><span>PlayStation Europe</span></div>
                </div>
              </section>

              <section id="responses">
                <div className="api-section-title">
                  <span>04</span>
                  <h2>Response format</h2>
                </div>
                <p>
                  Each price record includes the average, observed range,
                  common stack quantity, and date. Missing trait or quality
                  combinations are omitted.
                </p>
                <Code>{`{
  "item": {
    "internalId": 1393740546,
    "name": "Dreugh Wax",
    "description": "Improves an item from Epic to Legendary."
  },
  "pricing": {
    "xbox-na": {
      "--": {
        "--": {
          "average": 2865,
          "date": "2026-03-29",
          "commonQuantity": 8,
          "minimum": 2600,
          "maximum": 3500
        }
      }
    }
  }
}`}</Code>
              </section>

              <aside className="api-docs-note">
                <strong>Built for community tools</strong>
                <p>
                  Cache responses where practical and link back to ESO Market
                  Tracker when publishing derived prices.
                </p>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
