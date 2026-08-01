import { IonIcon } from "@ionic/react";
import {
  analyticsOutline,
  cloudDoneOutline,
  pulseOutline,
} from "ionicons/icons";
import { Link } from "react-router-dom";

import { MARKET_STATS } from "../marketStats";
import { PLATFORMS, usePlatform } from "../platform";
import * as routes from "../routes";
import { __useItem, __useItemHistory } from "../pages/useItem";
import { GoldPrice } from "./GoldPrice";
import LocalImage from "./LocalImage";
import MarketSparkline from "./MarketSparkline";
import PlaceholderImage from "./PlaceholderImage";

const TRENDING_ITEMS = [
  "Dreugh Wax",
  "Tempering Alloy",
  "Chromium Plating",
  "Perfect Roe",
];
const SPARKLINE_WINDOW_DAYS = 93;
const DAY_IN_MILLISECONDS = 86_400_000;

const TrendingItem = ({ name }: { name: string }) => {
  const { platform } = usePlatform();
  const item = __useItem(name).data;
  const history = __useItemHistory(name).data;
  if (!item) return <div className="market-trending-card is-loading" />;

  const currentPrice = item.currentXboxStats.averageUnitPrice;
  const currentTime = new Date(item.currentXboxStats.date).getTime();
  const chartHistory = (history || []).filter(
    (point) =>
      new Date(point.date).getTime() >=
      currentTime - SPARKLINE_WINDOW_DAYS * DAY_IN_MILLISECONDS,
  );
  const startingPrice = chartHistory.at(0)?.averageUnitPrice || currentPrice;
  const trend = startingPrice
    ? ((currentPrice - startingPrice) / startingPrice) * 100
    : 0;

  return (
    <Link className="market-trending-card" to={routes.getItem(name, platform)}>
      <div className="market-trending-item">
        {item.imageLink ? (
          <LocalImage imageUrl={item.imageLink} />
        ) : (
          <PlaceholderImage isMissing />
        )}
        <div>
          <strong>{item.displayLabel}</strong>
          <GoldPrice value={currentPrice} />
        </div>
      </div>
      <MarketSparkline
        compact
        history={chartHistory}
        current={currentPrice}
        fallbackValues={[
          item.currentXboxStats.minimumUnitPrice,
          item.currentXboxStats.commonUnitPriceRangeLower,
          item.currentXboxStats.averageUnitPrice,
          item.currentXboxStats.commonUnitPriceRangeUpper,
          item.currentXboxStats.maximumUnitPrice,
        ]}
      />
      <small className={trend >= 0 ? "is-up" : "is-down"}>
        <strong>
          {trend >= 0 ? "+" : ""}
          {trend.toFixed(1)}%
        </strong>
        <span>3m trend</span>
      </small>
    </Link>
  );
};

export default () => {
  const { platform } = usePlatform();

  return (
    <>
      <section className="market-pulse">
        <div className="market-section-heading">
          <div>
            <span>Market pulse</span>
            <h2>The console economy, at a glance</h2>
          </div>
          <strong>{PLATFORMS[platform]}</strong>
        </div>
        <div className="market-pulse-grid">
          <div>
            <IonIcon icon={pulseOutline} />
            <span>Observations processed</span>
            <strong>{MARKET_STATS.observations.toLocaleString()}</strong>
            <small>Versioned public market evidence</small>
          </div>
          <div>
            <IonIcon icon={analyticsOutline} />
            <span>Active price records</span>
            <strong>{MARKET_STATS.pricingRecords.toLocaleString()}</strong>
            <small>Normalized across four megaservers</small>
          </div>
          <div>
            <IonIcon icon={cloudDoneOutline} />
            <span>Data cadence</span>
            <strong>Daily</strong>
            <small>Automated, reproducible refreshes</small>
          </div>
        </div>
      </section>

      <section className="market-trending">
        <div className="market-section-heading">
          <div>
            <span>Trending now</span>
            <h2>Items traders are watching</h2>
          </div>
          <Link to={routes.getCategory("Mats (Gold)", platform)}>
            View gold materials →
          </Link>
        </div>
        <div className="market-trending-grid">
          {TRENDING_ITEMS.map((name) => (
            <TrendingItem key={name} name={name} />
          ))}
        </div>
      </section>
    </>
  );
};
