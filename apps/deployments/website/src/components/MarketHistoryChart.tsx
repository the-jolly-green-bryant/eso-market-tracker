import { useMemo, useState } from "react";

import { SalesRollupType } from "../models/tradable-item-types";
import { GoldPrice } from "./GoldPrice";
import SalesChart from "./SalesChart";
import MarketSparkline from "./MarketSparkline";
import { fillDailyHistory } from "./daily-history";

const ranges = [
  ["1M", 31],
  ["3M", 93],
  ["1Y", 365],
  ["2Y", 730],
  ["All", 0],
] as const;

/* eslint-disable max-lines-per-function -- chart controls and readout are intentionally cohesive */
export default ({
  history,
  current,
}: {
  history: SalesRollupType[];
  current: SalesRollupType;
}) => {
  const [days, setDays] = useState(93);
  const [isDelta, setIsDelta] = useState(false);
  const [selected, setSelected] = useState<SalesRollupType | null>(null);
  const dailyHistory = useMemo(
    () => fillDailyHistory([...history, current]),
    [current, history],
  );
  const data = useMemo(() => {
    const currentTime = new Date(current.date).getTime();
    const cutoff = days ? currentTime - days * 86_400_000 : 0;
    const points = dailyHistory.filter(
      (point) => new Date(point.date).getTime() >= cutoff,
    );
    return points.length ? points : [current];
  }, [current, dailyHistory, days]);
  const shown = selected || current;
  const startDate = new Date(data.at(0)?.date || current.date);
  const firstPrice = data.at(0)?.averageUnitPrice || shown.averageUnitPrice;
  const trend = firstPrice
    ? ((shown.averageUnitPrice - firstPrice) / firstPrice) * 100
    : 0;
  const rangeLabel =
    ranges.find(([, value]) => value === days)?.[0] || "Selected";

  return (
    <>
      <div className="market-chart-toolbar">
        <div>
          {ranges.map(([label, value]) => (
            <button
              className={days === value ? "is-active" : ""}
              key={label}
              onClick={() => setDays(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className={isDelta ? "is-active" : ""}
          onClick={() => setIsDelta(!isDelta)}
        >
          Δ Delta
        </button>
      </div>
      <div className="market-chart-readout">
        <div>
          <strong>
            <GoldPrice value={shown.averageUnitPrice} />
          </strong>
          <b className={trend >= 0 ? "is-up" : "is-down"}>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%<small>{rangeLabel} trend</small>
          </b>
        </div>
        <span>
          <b>{shown.date}</b>
          <small>Click and drag to inspect</small>
        </span>
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
  );
};
/* eslint-enable max-lines-per-function */
