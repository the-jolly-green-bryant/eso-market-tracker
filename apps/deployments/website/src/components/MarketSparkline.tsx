import { SalesRollupType } from '../models/tradable-item-types'

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
          id={compact ? 'compact-chart-fill' : 'item-chart-fill'}
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#d9ad5b" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#d9ad5b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${compact ? 'compact-chart-fill' : 'item-chart-fill'})`}
      />
      <polyline points={points} fill="none" stroke="#e4b85f" strokeWidth="3" />
    </svg>
  )
}
