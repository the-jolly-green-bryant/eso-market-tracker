import { useMemo, useState } from 'react'

import { SalesRollupType } from '../models/tradable-item-types'
import SalesChart from './SalesChart'
import MarketSparkline from './MarketSparkline'

const ranges = [
  ['3M', 93],
  ['1Y', 365],
  ['2Y', 730],
  ['All', 0],
] as const

export default ({
  history,
  current,
}: {
  history: SalesRollupType[]
  current: SalesRollupType
}) => {
  const [days, setDays] = useState(730)
  const [isDelta, setIsDelta] = useState(false)
  const [selected, setSelected] = useState<SalesRollupType | null>(null)
  const data = useMemo(() => {
    const currentTime = new Date(current.date).getTime()
    const cutoff = days ? currentTime - days * 86_400_000 : 0
    const points = history.filter(
      (point) => new Date(point.date).getTime() >= cutoff
    )
    return points.length ? points : [current]
  }, [current, days, history])
  const shown = selected || current
  const startDate = new Date(data.at(0)?.date || current.date)

  return (
    <>
      <div className="market-chart-toolbar">
        <div>
          {ranges.map(([label, value]) => (
            <button
              className={days === value ? 'is-active' : ''}
              key={label}
              onClick={() => setDays(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className={isDelta ? 'is-active' : ''}
          onClick={() => setIsDelta(!isDelta)}
        >
          Δ Delta
        </button>
      </div>
      <div className="market-chart-readout">
        <strong>{Math.round(shown.averageUnitPrice).toLocaleString()} gold</strong>
        <span>{shown.date} · click and drag to inspect</span>
      </div>
      <div className="market-interactive-chart">
        {data.length > 1 ? (
          <SalesChart
            startDate={startDate}
            data={{ item: data }}
            selectedKey="item"
            isDelta={isDelta}
            onDataPointChanged={setSelected}
            onDataPointReleased={() => setSelected(null)}
          />
        ) : (
          <MarketSparkline
            history={data}
            current={current.averageUnitPrice}
            fallbackValues={[
              current.minimumUnitPrice,
              current.commonUnitPriceRangeLower,
              current.averageUnitPrice,
              current.commonUnitPriceRangeUpper,
              current.maximumUnitPrice,
            ]}
          />
        )}
      </div>
    </>
  )
}
