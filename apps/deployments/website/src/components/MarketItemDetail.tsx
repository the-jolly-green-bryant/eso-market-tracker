import { IonIcon } from "@ionic/react";
import {
  arrowBackOutline,
  pricetagOutline,
  pulseOutline,
  swapHorizontalOutline,
  timeOutline,
} from "ionicons/icons";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

import { getItemVariantStats, ItemVariantOption } from "../item-variants";
import {
  SalesRollupType,
  TradableItemType,
} from "../models/tradable-item-types";
import { MarketPlatform } from "../platform";
import * as routes from "../routes";
import { GoldPrice, GoldPriceRange } from "./GoldPrice";
import MarketHeader from "./MarketHeader";
import MarketHistoryChart from "./MarketHistoryChart";
import MarketItemIdentity from "./MarketItemIdentity";
import SearchBar from "./SearchBar";
import "./MarketItemDetail.scss";

/* eslint-disable max-lines-per-function */

const QualityPrices = ({
  item,
  traitId,
}: {
  item: TradableItemType;
  traitId: string;
}) => {
  const trait = item.raw?.[traitId] ?? {};
  const qualities = [
    ["Legendary", "05", "#d9ad5b"],
    ["Epic", "04", "#a779d4"],
    ["Superior", "03", "#4f91d8"],
    ["Fine", "02", "#5ea967"],
    ["Common", "01", "#b8b8b8"],
  ] as const;
  const available = qualities.filter(([, key]) => trait[key]?.average);

  if (!available.length) return null;

  return (
    <section className="market-item-panel">
      <div className="market-item-section-heading">
        <span>Quality breakdown</span>
        <h2>Price by quality</h2>
      </div>
      <div className="market-item-quality-list">
        {available.map(([label, key, color]) => (
          <div key={key}>
            <span
              className="market-item-quality-dot"
              style={{ background: color }}
            />
            <strong>{label}</strong>
            <b>
              <GoldPrice value={trait[key].average} />
            </b>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ({
  item,
  history,
  onQualityChange,
  onTraitChange,
  qualities,
  qualityId,
  traits,
  traitId,
}: {
  item: TradableItemType;
  history: SalesRollupType[];
  onQualityChange: (qualityId: string) => void;
  onTraitChange: (traitId: string) => void;
  qualities: ItemVariantOption[];
  qualityId: string;
  traits: ItemVariantOption[];
  traitId: string;
}) => {
  const platform = (item.platform || "xbox-na") as MarketPlatform;
  const stats =
    getItemVariantStats(item.raw, traitId, qualityId) ?? item.currentXboxStats;
  const previous = [...history]
    .reverse()
    .find((point) => point.date !== stats.date)?.averageUnitPrice;
  const delta = previous ? stats.averageUnitPrice - previous : null;
  const change = previous ? (delta! / previous) * 100 : null;
  const observationCount = new Set([
    stats.date,
    ...history.map((point) => point.date),
  ]).size;
  const summaryStats: Array<[string, ReactNode, string]> = [
    ["Low", <GoldPrice value={stats.minimumUnitPrice} />, pricetagOutline],
    ["High", <GoldPrice value={stats.maximumUnitPrice} />, pulseOutline],
    [
      "Typical range",
      <GoldPriceRange
        minimum={stats.commonUnitPriceRangeLower}
        maximum={stats.commonUnitPriceRangeUpper}
      />,
      swapHorizontalOutline,
    ],
    ["Price observations", observationCount.toLocaleString(), timeOutline],
    [
      "Price delta",
      delta === null ? (
        "New"
      ) : (
        <GoldPrice value={delta} prefix={delta >= 0 ? "+" : ""} />
      ),
      swapHorizontalOutline,
    ],
  ];

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
              <SearchBar placeholderText="Search another item" />
            </div>
          </div>

          <section className="market-item-hero">
            <MarketItemIdentity
              item={item}
              onQualityChange={onQualityChange}
              onTraitChange={onTraitChange}
              platform={platform}
              qualities={qualities}
              qualityId={qualityId}
              traits={traits}
              traitId={traitId}
            />

            <div className="market-item-price-card">
              <span>Average unit price</span>
              <strong>
                <GoldPrice value={stats.averageUnitPrice} />
              </strong>
              <small>Updated {stats.date}</small>
              {change !== null && (
                <b className={change >= 0 ? "is-up" : "is-down"}>
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}% since previous observation
                </b>
              )}
            </div>
          </section>

          <section className="market-item-stats" aria-label="Price summary">
            {summaryStats.map(([label, value, icon]) => (
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
              <MarketHistoryChart history={history} current={stats} />
            </section>

            <section className="market-item-panel market-item-guidance">
              <div className="market-item-section-heading">
                <span>Listing guidance</span>
                <h2>Know your number</h2>
              </div>
              <div>
                <span>Fast sale</span>
                <strong>
                  <GoldPrice value={stats.commonUnitPriceRangeLower} />
                </strong>
              </div>
              <div>
                <span>Market average</span>
                <strong>
                  <GoldPrice value={stats.averageUnitPrice} />
                </strong>
              </div>
              <div>
                <span>Patient listing</span>
                <strong>
                  <GoldPrice value={stats.commonUnitPriceRangeUpper} />
                </strong>
              </div>
            </section>
          </div>

          <QualityPrices item={item} traitId={traitId} />

          <section className="market-item-method">
            <h2>About this price</h2>
            <p>
              Values are aggregated from recent console market observations.
              Choose a trait or quality above for variant-specific pricing, or
              leave both on All for the combined market. Switch megaservers
              above to compare Xbox and PlayStation regions.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
