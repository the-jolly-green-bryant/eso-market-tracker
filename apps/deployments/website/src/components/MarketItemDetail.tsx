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
import PlaceholderImage from './PlaceholderImage'
import './MarketItemDetail.scss'

/* eslint-disable max-lines-per-function */

const gold = (value: number) => `${Math.round(value).toLocaleString()} gold`

const Sparkline = ({
  history,
  current,
}: {
  history: SalesRollupType[]
  current: number
}) => {
  const values = [...history.map((point) => point.averageUnitPrice), current]
  if (values.length < 2) {
    return <div className="market-item-chart-empty">More history coming soon</div>
  }

  const width = 800
  const height = 220
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 28) - 14
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      className="market-item-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Price history"
    >
      <defs>
        <linearGradient id="item-chart-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d9ad5b" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#d9ad5b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#item-chart-fill)"
      />
      <polyline points={points} fill="none" stroke="#e4b85f" strokeWidth="3" />
    </svg>
  )
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
  const first = history.at(0)?.averageUnitPrice
  const change = first ? ((stats.averageUnitPrice - first) / first) * 100 : null

  return (
    <div className="market-item-page">
      <MarketHeader />
      <main className="market-item-scroll">
        <div className="market-item-shell">
          <Link className="market-item-back" to={`${routes.dashboard()}/`}>
            <IonIcon icon={arrowBackOutline} /> Back to market
          </Link>

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
                  {change.toFixed(1)}% over selected history
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
                'Common stack',
                stats.commonQuantity.toLocaleString(),
                timeOutline,
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
              <Sparkline history={history} current={stats.averageUnitPrice} />
              <div className="market-item-chart-labels">
                <span>{history.at(0)?.date || 'Earlier'}</span>
                <span>{stats.date}</span>
              </div>
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
