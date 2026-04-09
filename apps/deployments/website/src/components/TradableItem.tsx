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
import TradableItemReference from '../components/TradableItemReference'
import {
    TradableItemType,
    SalesRollupType,
} from '../models/tradable-item-types'
import './TradableItem.scss'

interface ContainerProps {
    item: TradableItemType
    referenceItems?: TradableItemType[]
}

const TradableItem: React.FC<ContainerProps> = ({
    item,
    referenceItems = [],
}) => {
    const ONE_MONTH = 31
    const THREE_MONTHS = 31 * 3
    const SIX_MONTHS = 31 * 6
    const ONE_YEAR = 365
    const TWO_YEARS = 365 * 2

    const LISTING_FEE = 0.01
    const GUILD_TAX = 0.035
    const HIRING_FEE = 0.035

    const default_time_span = ONE_MONTH

    const [currentStat, setCurrentStat] = useState<'average' | 'sales'>(
        'average',
    )

    const [isDelta, setIsDelta] = useState(false)

    const [averagePrice, setAveragePrice] = useState(
        item.currentXboxStats.averageUnitPrice,
    )

    const [totalSales, setTotalSales] = useState(
        item.currentXboxStats.totalSales,
    )

    const [currentDate, setCurrentDate] = useState(item.currentXboxStats.date)
    const [currentDaysFiltered, setCurrentDaysFiltered] =
        useState(default_time_span)

    const getTargetDateFromDays = (days: number): Date => {
        const today = new Date(item.currentXboxStats.date)
        return new Date(
            new Date(item.currentXboxStats.date).setDate(
                today.getDate() - days,
            ),
        )
    }

    const [startDate, setStartDate] = useState(
        getTargetDateFromDays(default_time_span),
    )

    const getFilteredData = (days: number) => {
        /* Filters our data such that it only contains items from the past n days. */

        const targetDate = getTargetDateFromDays(days)
        let newFilteredData = {
            [item.slug]: item.historicalXboxStats.filter((point) => {
                return new Date(point.date) >= targetDate
            }),
        }

        referenceItems.forEach((referenceItem) => {
            newFilteredData[referenceItem.slug] =
                referenceItem.historicalXboxStats.filter((point) => {
                    return new Date(point.date) >= targetDate
                })
        })

        return newFilteredData
    }

    const [salesAreUp, setSalesAreUp] = useState(
        getFilteredData(default_time_span)[item.slug][0].averageUnitPrice <
            item.currentXboxStats.averageUnitPrice,
    )

    const [filteredData, setFilteredData] = useState<{
        [key: string]: SalesRollupType[]
    }>(getFilteredData(default_time_span))

    const setTargetStartDate = (days: number) => {
        const targetDate = getTargetDateFromDays(days)
        setStartDate(targetDate)
    }

    const getAndSetFilteredData = (days: number) => {
        const newlyFilteredData = getFilteredData(days)
        setTargetStartDate(days)
        setFilteredData(newlyFilteredData)
        setCurrentDaysFiltered(days)
        setSalesAreUp(
            newlyFilteredData[item.slug][0].averageUnitPrice <
                item.currentXboxStats.averageUnitPrice,
        )
    }

    const onDataPointChanged = (point: SalesRollupType) => {
        /* Alters the display of our average price to correspond with the given point. */

        if (!point) {
            return
        }

        setTotalSales(point.totalSales)
        setAveragePrice(point.averageUnitPrice)
        setCurrentDate(point.date)
    }

    const onDataPointReleased = () => {
        /* Reverts the display of our average price to the current time. */

        onDataPointChanged(item.currentXboxStats)
    }

    const getHTMLWithParsedEntities = (entitiedText: string) => {
        let parsedHTML = entitiedText
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')

        // Change our internal links to open in-app and be styled.
        const internalLinkRegex = /(<a href=\"INTERNAL_LINK\/.*?\".*?<\/a>)/g
        const matches = [...parsedHTML.matchAll(internalLinkRegex)]
        for (const linkHTML of matches) {
            const newLinkHtml = linkHTML[0]
                .replace('target="_blank"', '')
                .replace('class=" external"', 'class="is-internal-link"')
            parsedHTML = parsedHTML.replace(linkHTML[0], newLinkHtml)
        }

        return parsedHTML
    }

    const toggleIsDelta = () => {
        setIsDelta(!isDelta)
    }

    // Render our chart only after the page loads.
    const [chartIsRendered, setChartIsRendered] = useState(false)
    useEffect(() => {
        setChartIsRendered(true)
    }, [])

    return (
        <div className={`tradable-item ${salesAreUp ? 'is-up' : 'is-down'}`}>
            <div className="tradable-item-header">
                <div
                    className="tradable-item-header-stat-container"
                    onClick={() => {
                        setCurrentStat(
                            currentStat == 'average' ? 'sales' : 'average',
                        )
                    }}
                >
                    <div className="tradable-item-header-title">
                        {currentStat == 'average'
                            ? item.labelForAverage || 'Avg. Worth'
                            : item.labelForSales || 'Total Sales'}
                    </div>

                    <div className="tradable-item-header-price">
                        {Math.round(
                            currentStat == 'average'
                                ? averagePrice
                                : totalSales,
                        ).toLocaleString()}
                    </div>

                    <div className="tradable-item-header-date">
                        as of{' '}
                        {currentDate == '2024-11-14' ? 'today' : currentDate}
                    </div>
                </div>

                <div
                    className="tradable-item-header-stat-container is-secondary"
                    onClick={() => {
                        setCurrentStat(
                            currentStat == 'average' ? 'sales' : 'average',
                        )
                    }}
                >
                    <div className="tradable-item-header-title">
                        {currentStat != 'average'
                            ? item.labelForAverage || 'Avg. Worth'
                            : item.labelForSales || 'Total Sales'}
                    </div>

                    <div className="tradable-item-header-price">
                        {Math.round(
                            currentStat != 'average'
                                ? averagePrice
                                : totalSales,
                        ).toLocaleString()}
                    </div>
                </div>

                <div className="tradable-item-header-graph">
                    {filteredData[item.slug].length <= 1 && (
                        <div className="tradable-item-header-graph-empty">
                            Limited Sales Data Available
                        </div>
                    )}

                    {chartIsRendered && filteredData[item.slug].length > 1 && (
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

                <div className="tradable-item-header-graph-toggle-container">
                    <div className="tradable-item-header-graph-toggle-group">
                        <div
                            className={`tradable-item-header-graph-toggle ${
                                currentDaysFiltered == ONE_MONTH
                                    ? 'is-active'
                                    : ''
                            }`}
                            onClick={() => {
                                getAndSetFilteredData(ONE_MONTH)
                            }}
                        >
                            1M
                        </div>

                        <div
                            className={`tradable-item-header-graph-toggle ${
                                currentDaysFiltered == THREE_MONTHS
                                    ? 'is-active'
                                    : ''
                            }`}
                            onClick={() => {
                                getAndSetFilteredData(THREE_MONTHS)
                            }}
                        >
                            3M
                        </div>

                        <div
                            className={`tradable-item-header-graph-toggle ${
                                currentDaysFiltered == SIX_MONTHS
                                    ? 'is-active'
                                    : ''
                            }`}
                            onClick={() => {
                                getAndSetFilteredData(SIX_MONTHS)
                            }}
                        >
                            6M
                        </div>

                        <div
                            className={`tradable-item-header-graph-toggle ${
                                currentDaysFiltered == ONE_YEAR
                                    ? 'is-active'
                                    : ''
                            }`}
                            onClick={() => {
                                getAndSetFilteredData(ONE_YEAR)
                            }}
                        >
                            1Y
                        </div>

                        <div
                            className={`tradable-item-header-graph-toggle ${
                                currentDaysFiltered == TWO_YEARS
                                    ? 'is-active'
                                    : ''
                            }`}
                            onClick={() => {
                                getAndSetFilteredData(TWO_YEARS)
                            }}
                        >
                            2Y
                        </div>
                    </div>

                    <div
                        className={`tradable-item-header-graph-toggle is-action ${
                            isDelta ? 'is-active' : ''
                        }`}
                        onClick={() => {
                            toggleIsDelta()
                        }}
                    >
                        <IonIcon icon={triangleOutline}></IonIcon>

                        <div className="tradable-item-header-graph-toggle-label">
                            DELTA
                        </div>
                    </div>
                </div>
            </div>

            <div className="tradable-item-content">
                {item.isVolatile && (
                    <LoadingSkeleton
                        error={false}
                        loading={false}
                        title="Your Mileage May Vary!"
                        message={`The pricing for this item is inconsistent. This could be due to newness, item quality, traits, and more.`}
                    />
                )}

                <div className="tradable-item-content-header">
                    <div className="tradable-item-content-header-text">
                        <div className="tradable-item-content-header-category">
                            {item.category
                                ? item.category.displayLabel
                                : 'Uncategorized'}
                        </div>

                        <div className="tradable-item-content-header-title">
                            {item.displayLabel}
                        </div>
                    </div>
                    <div className="tradable-item-content-header-image">
                        {item.imageLink && (
                            <LocalImage imageUrl={item.imageLink} />
                        )}

                        {!item.imageLink && (
                            <PlaceholderImage isMissing={true} />
                        )}
                    </div>
                </div>

                <div className="tradable-item-content-section">
                    <div className="tradable-item-content-section-column">
                        <div className="tradable-item-stat-container">
                            <div className="tradable-item-stat-icon">
                                <IonIcon icon={removeOutline}></IonIcon>
                            </div>
                            <div className="tradable-item-stat-label">
                                Minimum
                            </div>

                            <div className="tradable-item-stat-value">
                                {Math.round(
                                    item.currentXboxStats.minimumUnitPrice,
                                ).toLocaleString()}
                            </div>
                        </div>

                        {/*<div className="tradable-item-stat-container">
                            <div className="tradable-item-stat-icon">ICON</div>
                            <div className="tradable-item-stat-label">Median</div>

                            <div className="tradable-item-stat-value">
                                {item.currentXboxStats.medianUnitPrice.toLocaleString()}
                            </div>
                        </div>*/}

                        <div className="tradable-item-stat-container">
                            <div className="tradable-item-stat-icon">
                                <IonIcon icon={addOutline}></IonIcon>
                            </div>
                            <div className="tradable-item-stat-label">
                                Maximum
                            </div>

                            <div className="tradable-item-stat-value">
                                {Math.round(
                                    item.currentXboxStats.maximumUnitPrice,
                                ).toLocaleString()}
                            </div>
                        </div>

                        <div className="tradable-item-stat-container">
                            <div className="tradable-item-stat-icon">
                                <IonIcon icon={swapHorizontalOutline}></IonIcon>
                            </div>

                            <div className="tradable-item-stat-label">
                                Common Variance
                            </div>

                            <div className="tradable-item-stat-value">
                                {Math.floor(
                                    (item.currentXboxStats
                                        .commonUnitPriceRangeUpper -
                                        item.currentXboxStats
                                            .commonUnitPriceRangeLower) /
                                        2,
                                ).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="tradable-item-content-section-column">
                        <div className="tradable-item-stat-container">
                            <div className="tradable-item-stat-icon">
                                <IonIcon
                                    icon={fileTrayStackedOutline}
                                ></IonIcon>
                            </div>
                            <div className="tradable-item-stat-label">
                                Common Stack Size
                            </div>

                            <div className="tradable-item-stat-value">
                                {item.currentXboxStats.commonQuantity}
                            </div>
                        </div>

                        <div className="tradable-item-stat-container">
                            <div className="tradable-item-stat-icon">
                                <IonIcon icon={cashOutline}></IonIcon>
                            </div>
                            <div className="tradable-item-stat-label">
                                Recent Sales
                            </div>

                            <div className="tradable-item-stat-value">
                                {Math.round(
                                    item.currentXboxStats.recentSales,
                                ).toLocaleString()}
                            </div>
                        </div>

                        <div className="tradable-item-stat-container">
                            <div className="tradable-item-stat-icon">
                                <IonIcon icon={cashOutline}></IonIcon>
                            </div>
                            <div className="tradable-item-stat-label">
                                Break Even
                            </div>

                            <div className="tradable-item-stat-value">
                                {Math.floor(
                                    item.currentXboxStats.averageUnitPrice *
                                        (1 -
                                            GUILD_TAX -
                                            HIRING_FEE -
                                            LISTING_FEE),
                                ).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tradable-item-stat-container">
                    <div className="tradable-item-stat-icon">
                        <IonIcon icon={swapHorizontalOutline}></IonIcon>
                    </div>
                    <div className="tradable-item-stat-label">Common Range</div>

                    <div className="tradable-item-stat-value">
                        {Math.round(
                            item.currentXboxStats.commonUnitPriceRangeLower,
                        ).toLocaleString()}{' '}
                        -{' '}
                        {Math.round(
                            item.currentXboxStats.commonUnitPriceRangeUpper,
                        ).toLocaleString()}
                    </div>
                </div>

                {item.currentXboxStats.numberOfQualitiesTracked >= 1 && (
                    <div>
                        <div className="tradable-item-content-section is-simple">
                            <div className="tradable-item-content-section-header">
                                Average Unit Price by Quality
                            </div>
                        </div>

                        <div className="tradable-item-content-section">
                            <div className="tradable-item-content-section-column">
                                <div className="tradable-item-stat-container">
                                    <div className="tradable-item-stat-icon is-legendary">
                                        <IonIcon icon={star}></IonIcon>
                                    </div>
                                    <div className="tradable-item-stat-label">
                                        Legendary (Gold)
                                    </div>

                                    <div className="tradable-item-stat-value">
                                        {item.currentXboxStats
                                            .goldAverageUnitPrice
                                            ? item.currentXboxStats.goldAverageUnitPrice.toLocaleString()
                                            : 'N/A'}
                                    </div>
                                </div>

                                <div className="tradable-item-stat-container">
                                    <div className="tradable-item-stat-icon is-superior">
                                        <IonIcon icon={star}></IonIcon>
                                    </div>
                                    <div className="tradable-item-stat-label">
                                        Superior (Blue)
                                    </div>

                                    <div className="tradable-item-stat-value">
                                        {item.currentXboxStats
                                            .blueAverageUnitPrice
                                            ? item.currentXboxStats.blueAverageUnitPrice.toLocaleString()
                                            : 'N/A'}
                                    </div>
                                </div>

                                <div className="tradable-item-stat-container">
                                    <div className="tradable-item-stat-icon is-common">
                                        <IonIcon icon={star}></IonIcon>
                                    </div>
                                    <div className="tradable-item-stat-label">
                                        Common (White)
                                    </div>

                                    <div className="tradable-item-stat-value">
                                        {item.currentXboxStats
                                            .whiteAverageUnitPrice
                                            ? item.currentXboxStats.whiteAverageUnitPrice.toLocaleString()
                                            : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div className="tradable-item-content-section-column">
                                <div className="tradable-item-stat-container">
                                    <div className="tradable-item-stat-icon is-epic">
                                        <IonIcon icon={star}></IonIcon>
                                    </div>
                                    <div className="tradable-item-stat-label">
                                        Epic (Purple)
                                    </div>

                                    <div className="tradable-item-stat-value">
                                        {item.currentXboxStats
                                            .purpleAverageUnitPrice
                                            ? item.currentXboxStats.purpleAverageUnitPrice.toLocaleString()
                                            : 'N/A'}
                                    </div>
                                </div>

                                <div className="tradable-item-stat-container">
                                    <div className="tradable-item-stat-icon is-fine">
                                        <IonIcon icon={star}></IonIcon>
                                    </div>
                                    <div className="tradable-item-stat-label">
                                        Fine (Green)
                                    </div>

                                    <div className="tradable-item-stat-value">
                                        {item.currentXboxStats
                                            .greenAverageUnitPrice
                                            ? item.currentXboxStats.greenAverageUnitPrice.toLocaleString()
                                            : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(item.description || item.howToAcquire) && (
                    <div className="tradable-item-content-section is-simple" />
                )}

                {item.description && (
                    <div className="tradable-item-content-section is-simple">
                        <div className="tradable-item-content-section-header">
                            Description
                        </div>

                        <div
                            className="tradable-item-content-section-text"
                            dangerouslySetInnerHTML={{
                                __html: getHTMLWithParsedEntities(
                                    item.description,
                                ),
                            }}
                        />
                    </div>
                )}

                {item.howToAcquire && (
                    <div className="tradable-item-content-section is-simple">
                        <div className="tradable-item-content-section-header">
                            How to Acquire
                        </div>

                        <div
                            className="tradable-item-content-section-text"
                            dangerouslySetInnerHTML={{
                                __html: getHTMLWithParsedEntities(
                                    item.howToAcquire,
                                ),
                            }}
                        />
                    </div>
                )}

                {item.craftableSlug && (
                    <CraftableBreakdown slug={item.craftableSlug} />
                )}

                {item.refinableSlug && (
                    <RefinableBreakdown slug={item.refinableSlug} />
                )}

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
                            <a
                                href={item.wikiLink}
                                target="_blank"
                                className="is-external-link"
                            >
                                Click to Learn More{' '}
                                <IonIcon icon={openOutline}></IonIcon>
                            </a>
                        </div>
                    </div>
                )}

                {item.relatedItems!.length > 0 && (
                    <div>
                        <div className="page-container-section-label">
                            Related Items
                        </div>

                        {item.relatedItems!.map((relation) => {
                            return (
                                <TradableItemReference
                                    key={`related-item-${relation.slug}`}
                                    item={relation}
                                    disableClick={true}
                                />
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default TradableItem
