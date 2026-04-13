import { IonIcon } from '@ionic/react'
import {
  removeOutline,
  addOutline,
  swapHorizontalOutline,
  fileTrayStackedOutline,
  cashOutline,
  openOutline,
  star,
  triangleOutline,
} from 'ionicons/icons'
import { useState, useEffect } from 'react'
import CraftableBreakdown from '../components/CraftableBreakdown'
import LoadingSkeleton from '../components/LoadingSkeleton'
import LocalImage from '../components/LocalImage'
import PlaceholderImage from '../components/PlaceholderImage'
import RefinableBreakdown from '../components/RefinableBreakdown'
import SalesChart from '../components/SalesChart'
import {
  TradableItemType,
  SalesRollupType,
} from '../models/tradable-item-types'
import './TradableItem.scss'
import { toPrice } from './common'
import { TRAIT_LOOKUP } from '../constants'

const ONE_MONTH = 31
const THREE_MONTHS = 31 * 3
const SIX_MONTHS = 31 * 6
const ONE_YEAR = 365
const TWO_YEARS = 365 * 2

const LISTING_FEE = 0.01
const GUILD_TAX = 0.035
const HIRING_FEE = 0.035

const DEFAULT_TIME_SPAN = ONE_MONTH

const getTargetDateFromDays = (days: number, item: TradableItemType): Date =>
  new Date(
    new Date(item.currentXboxStats.date).setDate(
      new Date(item.currentXboxStats.date).getDate() - days
    )
  )

const _renderStat = ([label, value, icon, modClass]: [
  string,
  number,
  string,
  string?
]) => (
  <div className="tradable-item-stat-container">
    <div className={`tradable-item-stat-icon ${modClass}`}>
      <IonIcon icon={icon}></IonIcon>
    </div>
    <div className="tradable-item-stat-label">{label}</div>

    <div className="tradable-item-stat-value">
      {value ? toPrice(value) : 'N/A'}
    </div>
  </div>
)

const renderItemQualities = (raw: TradableItemType, traitId: string) => (
  <div>
    <div className="tradable-item-content-section is-simple">
      <div className="tradable-item-content-section-header">
        {traitId == '--'
          ? 'Average Unit Price by Quality'
          : `Trait: ${TRAIT_LOOKUP[Number.parseInt(traitId)]?.toUpperCase()}`}
      </div>
    </div>

    <div className="tradable-item-content-section">
      <div className="tradable-item-content-section-column">
        {(
          [
            [
              'Legendary (Gold)',
              raw[traitId]['05']?.average,
              star,
              'is-legendary',
            ],
            [
              'Superior (Blue)',
              raw[traitId]['03']?.average,
              star,
              'is-superior',
            ],
            ['Common (White)', raw[traitId]['01']?.average, star, 'is-common'],
          ] as [string, number, string, string?][]
        ).map(_renderStat)}
      </div>

      <div className="tradable-item-content-section-column">
        {(
          [
            ['Epic (Purple)', raw[traitId]['04']?.average, star, 'is-epic'],
            ['Fine (Green)', raw[traitId]['02']?.average, star, 'is-fine'],
          ] as [string, number, string, string?][]
        ).map(_renderStat)}
      </div>
    </div>
  </div>
)

const _renderVolatile = () => (
  <LoadingSkeleton
    error={false}
    loading={false}
    title="Your Mileage May Vary!"
    message={`The pricing for this item is inconsistent. This could be due to newness, item quality, traits, and more.`}
  />
)

const _renderItemMeta = (item: TradableItemType) => (
  <div className="tradable-item-content-header">
    <div className="tradable-item-content-header-text">
      <div className="tradable-item-content-header-category">
        {item.category ? item.category.displayLabel : 'Uncategorized'}
      </div>

      <div className="tradable-item-content-header-title">
        {item.displayLabel}
      </div>
    </div>
    <div className="tradable-item-content-header-image">
      {item.imageLink && <LocalImage imageUrl={item.imageLink} />}
      {!item.imageLink && <PlaceholderImage isMissing={true} />}
    </div>
  </div>
)

const _renderItemStats = (item: TradableItemType) => (
  <div className="tradable-item-content-section">
    <div className="tradable-item-content-section-column">
      {(
        [
          [
            'Minimum',
            item.currentXboxStats.minimumUnitPrice,
            removeOutline,
            undefined,
          ],
          [
            'Maximum',
            item.currentXboxStats.maximumUnitPrice,
            addOutline,
            undefined,
          ],
        ] as [string, number, string, string?][]
      ).map(_renderStat)}
    </div>

    <div className="tradable-item-content-section-column">
      {(
        [
          [
            'Common Stack Size',
            item.currentXboxStats.commonQuantity,
            fileTrayStackedOutline,
            undefined,
          ],
          [
            'Break Even',
            item.currentXboxStats.averageUnitPrice *
              (1 - GUILD_TAX - HIRING_FEE - LISTING_FEE),
            cashOutline,
            undefined,
          ],
        ] as [string, number, string, string?][]
      ).map(_renderStat)}
    </div>
  </div>
)

const renderItemContent = (item: TradableItemType) => (
  <div className="tradable-item-content">
    {item.isVolatile && _renderVolatile()}
    {_renderItemMeta(item)}

    {_renderItemStats(item)}

    <div className="tradable-item-stat-container">
      <div className="tradable-item-stat-icon">
        <IonIcon icon={swapHorizontalOutline}></IonIcon>
      </div>
      <div className="tradable-item-stat-label">Common Range</div>

      <div className="tradable-item-stat-value">
        {toPrice(item.currentXboxStats.commonUnitPriceRangeLower)} -{' '}
        {toPrice(item.currentXboxStats.commonUnitPriceRangeUpper)}
      </div>
    </div>

    {item.raw &&
      Object.keys(item.raw).map((i) => renderItemQualities(item.raw, i))}

    {(item.description || item.howToAcquire) && (
      <div className="tradable-item-content-section is-simple" />
    )}

    {item.description && (
      <div className="tradable-item-content-section is-simple">
        <div className="tradable-item-content-section-header">Description</div>

        <div className="tradable-item-content-section-text">
          {item.description}
        </div>
      </div>
    )}

    {item.craftableSlug && <CraftableBreakdown slug={item.craftableSlug} />}
    {item.refinableSlug && <RefinableBreakdown slug={item.refinableSlug} />}
    {item.detailedImageLink && (
      <div className="tradable-item-content-section is-simple">
        <div className="tradable-item-content-section-header">
          What It Looks Like
        </div>

        <div className="tradable-item-content-section-image">
          <LocalImage imageUrl={item.detailedImageLink} />
        </div>
      </div>
    )}

    {item.wikiLink && (
      <div className="tradable-item-content-section is-simple">
        <div className="tradable-item-content-section-text">
          <a href={item.wikiLink} target="_blank" className="is-external-link">
            Click to Learn More <IonIcon icon={openOutline}></IonIcon>
          </a>
        </div>
      </div>
    )}
  </div>
)

const useItemState = (
  item: TradableItemType,
  referenceItems: TradableItemType[]
) => {
  const currentAverage = item.currentXboxStats.averageUnitPrice
  const [currentStat, setCurrentStat] = useState<'average' | 'sales'>('average')
  const [isDelta, setIsDelta] = useState(false)

  const [daysShown, setDaysShown] = useState(DEFAULT_TIME_SPAN)
  const [startDate, setStartDate] = useState(
    getTargetDateFromDays(DEFAULT_TIME_SPAN, item)
  )

  // Filters our data to the given date range.
  const _compare = (days: number) => (point: SalesRollupType) =>
    new Date(point.date) >= getTargetDateFromDays(days, item)
  const getFilteredData = (days: number) =>
    Object.fromEntries([
      [item.slug, item.historicalXboxStats.filter(_compare(days))],
      ...referenceItems.map((referenceItem) => [
        referenceItem.slug,
        referenceItem.historicalXboxStats.filter(_compare(days)),
      ]),
    ])

  const [salesAreUp, setSalesAreUp] = useState(
    getFilteredData(DEFAULT_TIME_SPAN)[item.slug][0].averageUnitPrice <
      currentAverage
  )

  const [filteredData, setFilteredData] = useState<{
    [key: string]: SalesRollupType[]
  }>(getFilteredData(DEFAULT_TIME_SPAN))

  const setTargetStartDate = (days: number) =>
    setStartDate(getTargetDateFromDays(days, item))

  const getAndSetFilteredData = (days: number) => {
    const newlyFilteredData = getFilteredData(days)
    setTargetStartDate(days)
    setFilteredData(newlyFilteredData)
    setDaysShown(days)
    setSalesAreUp(
      newlyFilteredData[item.slug][0].averageUnitPrice < currentAverage
    )
  }

  return {
    currentAverage,
    currentStat,
    setCurrentStat,
    isDelta,
    setIsDelta,
    daysShown,
    setDaysShown,
    startDate,
    setStartDate,
    getFilteredData,
    filteredData,
    getAndSetFilteredData,
    salesAreUp,
  }
}

const _renderSpanToggles = (
  daysShown: number,
  getAndSetFilteredData: (arg0: number) => void
) => (
  <div className="tradable-item-header-graph-toggle-group">
    {(
      [
        ['1M', ONE_MONTH],
        ['3M', THREE_MONTHS],
        ['6M', SIX_MONTHS],
        ['1Y', ONE_YEAR],
        ['2Y', TWO_YEARS],
      ] as [string, number][]
    ).map(([period, days]) => (
      <div
        className={`tradable-item-header-graph-toggle ${
          daysShown == days && 'is-active'
        }`}
        onClick={() => getAndSetFilteredData(days)}
      >
        {period}
      </div>
    ))}
  </div>
)

const _renderHeader = () => (
  <div className="tradable-item-header-graph-empty">
    Limited Sales Data Available
  </div>
)

const useGraph = (
  item: TradableItemType,
  filteredData: Record<string, SalesRollupType[]>,
  currentStat: 'average' | 'sales',
  isDelta: boolean,
  startDate: Date
) => {
  const currentAverage = item.currentXboxStats.averageUnitPrice
  const [averagePrice, setAveragePrice] = useState(currentAverage)
  const [totalSales, setTotalSales] = useState(item.currentXboxStats.totalSales)
  const [currentDate, setCurrentDate] = useState(item.currentXboxStats.date)

  const onDataPointChanged = (point: SalesRollupType | null) =>
    point &&
    (setTotalSales(point.totalSales),
    setAveragePrice(point.averageUnitPrice),
    setCurrentDate(point.date))

  // Reverts the display of our average price to the current time.
  const onDataPointReleased = () => onDataPointChanged(item.currentXboxStats)
  const [chartIsRendered, setChartIsRendered] = useState(false)

  return {
    // Render our chart only after the page loads.
    renderGraph: () => (
      <div className="tradable-item-header-graph">
        {filteredData[item.slug].length <= 1 && _renderHeader()}

        {chartIsRendered && filteredData[item.slug].length >= 1 && (
          <SalesChart
            startDate={startDate}
            data={filteredData}
            selectedKey={item.slug}
            onDataPointChanged={onDataPointChanged}
            onDataPointReleased={onDataPointReleased}
            currentStat={currentStat}
            isDelta={isDelta}
          />
        )}
      </div>
    ),
    averagePrice,
    totalSales,
    currentDate,
    setChartIsRendered,
  }
}

export default ({
  item,
  referenceItems = [],
}: {
  item: TradableItemType
  referenceItems?: TradableItemType[]
}) => {
  const {
    currentStat,
    isDelta,
    setIsDelta,
    startDate,
    daysShown,
    salesAreUp,
    filteredData,
    getAndSetFilteredData,
  } = useItemState(item, referenceItems)

  const toggleIsDelta = () => setIsDelta(!isDelta)

  const { renderGraph, averagePrice, currentDate, setChartIsRendered } =
    useGraph(item, filteredData, currentStat, isDelta, startDate)
  useEffect(() => setChartIsRendered(true), [])

  const cTIH = `tradable-item-header`
  const label = currentStat == 'average' ? 'Avg. Worth' : 'Total Sales'
  const stat = toPrice(averagePrice)
  const date = currentDate == '2024-11-14' ? 'today' : currentDate

  return (
    <div className={`tradable-item ${salesAreUp ? 'is-up' : 'is-down'}`}>
      <div className={cTIH}>
        <div className={`${cTIH}-stat-container`}>
          <div className={`${cTIH}-title`}>{label}</div>
          <div className="tradable-item-header-price">{stat}</div>
          <div className="tradable-item-header-date">as of {date}</div>
        </div>

        {renderGraph()}

        <div className={`${cTIH}-graph-toggle-container`}>
          {_renderSpanToggles(daysShown, getAndSetFilteredData)}

          <div
            className={`${cTIH}-graph-toggle is-action ${
              isDelta && 'is-active'
            }`}
            onClick={() => toggleIsDelta()}
          >
            <IonIcon icon={triangleOutline}></IonIcon>
            <div className={`${cTIH}-graph-toggle-label`}>DELTA</div>
          </div>
        </div>
      </div>

      {renderItemContent(item)}
    </div>
  )
}
