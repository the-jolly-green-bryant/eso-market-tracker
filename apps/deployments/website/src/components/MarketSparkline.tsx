import { useId } from 'react'
import { SalesRollupType } from '../models/tradable-item-types'

/* eslint-disable max-lines-per-function -- SVG chart markup is intentionally cohesive */
export default ({
  history,
  current,
  compact = false,
  fallbackValues = [],
}: {
  history: SalesRollupType[]
  current: number
  compact?: boolean
  fallbackValues?: number[]
}) => {
  const chartId = useId().replaceAll(':', '')
  const historicalValues = history.map((point) => point.averageUnitPrice)
  const values =
    historicalValues.length > 1
      ? [...historicalValues, current]
      : [...fallbackValues, current]
  if (values.length < 2) {
    return <div className="market-item-chart-empty">More history coming soon</div>
  }

  const width = 800
  const height = compact ? 100 : 220
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const isUp = values.at(-1)! >= values.at(0)!
  const color = isUp ? '#59c778' : '#ee695e'
  const fillId = `market-chart-fill-${chartId}`
  const glowId = `market-chart-glow-${chartId}`
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * (height - 28) - 14
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      className={`market-item-sparkline${compact ? ' is-compact' : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Price history"
    >
      <defs>
        <linearGradient
          id={fillId}
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="58%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-30%" width="140%" height="160%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2"
            floodColor={color}
            floodOpacity="0.42"
          />
        </filter>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${fillId})`}
      />
      <polyline
        points={points}
        fill="none"
        filter={`url(#${glowId})`}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={compact ? 2 : 2.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
/* eslint-enable max-lines-per-function */
