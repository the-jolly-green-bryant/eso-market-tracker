import { IonIcon } from '@ionic/react'
import {
  arrowBackOutline,
  pricetagOutline,
  pulseOutline,
  swapHorizontalOutline,
  timeOutline,
} from 'ionicons/icons'
import { Link } from 'react-router-dom'

import { SalesRollupType, TradableItemType } from '../models/tradable-item-types'
import { PLATFORMS, MarketPlatform } from '../platform'
import * as routes from '../routes'
import LocalImage from './LocalImage'
import MarketHeader from './MarketHeader'
import MarketHistoryChart from './MarketHistoryChart'
import PlaceholderImage from './PlaceholderImage'
import SearchBar from './SearchBar'
import './MarketItemDetail.scss'

/* eslint-disable max-lines-per-function */

const gold = (value: number) => `${Math.round(value).toLocaleString()} gold`
const goldDelta = (value: number | null) => {
  if (value === null) return 'New'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${gold(value)}`
}

const QualityPrices = ({ item }: { item: TradableItemType }) => {
  const trait =
    item.raw?.['--'] ??
    item.raw?.[Object.keys(item.raw || {}).at(0) || '--'] ??
    {}
  const qualities = [
    ['Legendary', '05', '#d9ad5b'],
    ['Epic', '04', '#a779d4'],
    ['Superior', '03', '#4f91d8'],
    ['Fine', '02', '#5ea967'],
    ['Common', '01', '#b8b8b8'],
  ] as const
  const available = qualities.filter(([, key]) => trait[key]?.average)

  if (!available.length) return null

  return (
    <section className="market-item-panel">
      <div className="market-item-section-heading">
        <span>Quality breakdown</span>
        <h2>Price by quality</h2>
      </div>
      <div className="market-item-quality-list">
        {available.map(([label, key, color]) => (
          <div key={key}>
            <span className="market-item-quality-dot" style={{ background: color }} />
            <strong>{label}</strong>
            <b>{gold(trait[key].average)}</b>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ({
  item,
  history,
}: {
  item: TradableItemType
  history: SalesRollupType[]
}) => {
  const platform = (item.platform || 'xbox-na') as MarketPlatform
  const stats = item.currentXboxStats
  const previous = [...history]
    .reverse()
    .find((point) => point.date !== stats.date)?.averageUnitPrice
  const delta = previous ? stats.averageUnitPrice - previous : null
  const change = previous ? (delta! / previous) * 100 : null

  return (
    <div className="market-item-page">
      <MarketHeader />
      <main className="market-item-scroll">
        <div className="market-item-shell">
          <div className="market-item-tools">
            <Link className="market-item-back" to={`${routes.dashboard()}/`}>
              <IonIcon icon={arrowBackOutline} /> Back to market
            </Link>
            <div className="market-item-search">
              <SearchBar
                placeholderText="Search another item"
              />
            </div>
          </div>

          <section className="market-item-hero">
            <div className="market-item-identity">
              <div className="market-item-image">
                {item.imageLink ? (
                  <LocalImage imageUrl={item.imageLink} />
                ) : (
                  <PlaceholderImage isMissing />
                )}
              </div>
              <div>
                <span className="market-item-eyebrow">
                  {PLATFORMS[platform]} market value
                </span>
                <h1>{item.displayLabel}</h1>
                <p>{item.description || 'Console market pricing and history.'}</p>
              </div>
            </div>

            <div className="market-item-price-card">
              <span>Average unit price</span>
              <strong>{stats.averageUnitPrice.toLocaleString()}</strong>
              <small>gold · updated {stats.date}</small>
              {change !== null && (
                <b className={change >= 0 ? 'is-up' : 'is-down'}>
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(1)}% since previous observation
                </b>
              )}
            </div>
          </section>

          <section className="market-item-stats" aria-label="Price summary">
            {[
              ['Low', gold(stats.minimumUnitPrice), pricetagOutline],
              ['High', gold(stats.maximumUnitPrice), pulseOutline],
              [
                'Typical range',
                `${stats.commonUnitPriceRangeLower.toLocaleString()}–${stats.commonUnitPriceRangeUpper.toLocaleString()}`,
                swapHorizontalOutline,
              ],
              [
                'Recent sales',
                stats.recentSales.toLocaleString(),
                timeOutline,
              ],
              [
                'Price delta',
                goldDelta(delta),
                swapHorizontalOutline,
              ],
            ].map(([label, value, icon]) => (
              <div key={label}>
                <IonIcon icon={icon} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <div className="market-item-grid">
            <section className="market-item-panel market-item-history">
              <div className="market-item-section-heading">
                <span>Market movement</span>
                <h2>Price history</h2>
              </div>
              <MarketHistoryChart
                history={history}
                current={stats}
              />
            </section>

            <section className="market-item-panel market-item-guidance">
              <div className="market-item-section-heading">
                <span>Listing guidance</span>
                <h2>Know your number</h2>
              </div>
              <div>
                <span>Fast sale</span>
                <strong>{gold(stats.commonUnitPriceRangeLower)}</strong>
              </div>
              <div>
                <span>Market average</span>
                <strong>{gold(stats.averageUnitPrice)}</strong>
              </div>
              <div>
                <span>Patient listing</span>
                <strong>{gold(stats.commonUnitPriceRangeUpper)}</strong>
              </div>
            </section>
          </div>

          <QualityPrices item={item} />

          <section className="market-item-method">
            <h2>About this price</h2>
            <p>
              Values are aggregated from recent console market observations.
              Switch megaservers above to compare this item across Xbox and
              PlayStation regions.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
