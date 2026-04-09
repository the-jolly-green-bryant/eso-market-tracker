import { IonIcon } from '@ionic/react'
import {
    analyticsOutline,
    removeOutline,
    addOutline,
    swapHorizontalOutline,
    fileTrayStackedOutline,
    menuOutline,
    cashOutline,
    openOutline,
    star,
    starOutline,
    arrowForward,
    arrowBack,
    triangleOutline,
    triangle,
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
    TrendType,
    SalesRollupType,
} from '../models/tradable-item-types'
import './TradableItem.scss'

interface ContainerProps {
    items: TradableItemType[]
    trend: TrendType
    enableSales?: boolean
    enableAnnotations?: boolean
}

const Trend: React.FC<ContainerProps> = ({
    items,
    trend,
    enableSales = false,
    enableAnnotations = false,
}) => {
    const [item, setItem] = useState<TradableItemType>(
        items.find((i) => {
            return i.slug == trend.initiallySelectedItemSlug
        })!,
    )

    const [referenceItems, setReferenceItems] = useState<TradableItemType[]>(
        items.filter((i) => {
            return i.slug != trend.initiallySelectedItemSlug
        }),
    )

    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)

    const ONE_MONTH = 31
    const THREE_MONTHS = 31 * 3
    const SIX_MONTHS = 31 * 6
    const ONE_YEAR = 365
    const TWO_YEARS = 365 * 2

    const LISTING_FEE = 0.01
    const GUILD_TAX = 0.035
    const HIRING_FEE = 0.035

    const default_time_span = trend.focusTimespan!

    const [currentStat, setCurrentStat] = useState<'average' | 'sales'>(
        !trend.focusSales! ? 'average' : 'sales',
    )

    const [isStacked, setIsStacked] = useState(true)
    const [isDelta, setIsDelta] = useState(trend.focusDelta!)

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

        const referenceArray = getSummedDataByGroup(filteredData)
        const referenceKey = `group_${selectedGroupIndex}`
        let found = false
        referenceArray[referenceKey].forEach((rollup) => {
            if (rollup.date >= point.date && !found) {
                setTotalSales(rollup.totalSales)
                setAveragePrice(rollup.averageUnitPrice)
                setCurrentDate(rollup.date)
                found = true
            }
        })
    }

    const onDataPointReleased = () => {
        /* Reverts the display of our average price to the latest record. */

        const referenceArray = getSummedDataByGroup(filteredData)
        const referenceKey = `group_${selectedGroupIndex}`
        const lastReferenceRollup =
            referenceArray[referenceKey][
                referenceArray[referenceKey].length - 1
            ]

        onDataPointChanged(lastReferenceRollup)
    }

    const toggleIsStacked = () => {
        const newStackedValue = !isStacked
        setIsStacked(newStackedValue)

        const referenceArray = !newStackedValue
            ? filteredData
            : getSummedDataByGroup(filteredData)
        const referenceKey = !newStackedValue
            ? item.slug
            : `group_${selectedGroupIndex}`
        const lastReferenceRollup =
            referenceArray[referenceKey][
                referenceArray[referenceKey].length - 1
            ]

        onDataPointChanged(lastReferenceRollup)
    }

    const toggleIsDelta = () => {
        setIsDelta(!isDelta)
    }

    // Render our chart only after the page loads.
    const [chartIsRendered, setChartIsRendered] = useState(false)
    useEffect(() => {
        onDataPointReleased()
        setChartIsRendered(true)
    }, [])

    const getSummedDataByGroup = (keyedData: {
        [key: string]: SalesRollupType[]
    }) => {
        let groupedSales: { [key: string]: SalesRollupType[] } = {}
        trend.groupedSlugs!.forEach((keys, index) => {
            const groupKey = `group_${index}`

            groupedSales[groupKey] = []
            Object.entries(keyedData).forEach(
                ([entryKey, entryData]: [string, SalesRollupType[]]) => {
                    if (keys.includes(entryKey)) {
                        groupedSales[groupKey] =
                            groupedSales[groupKey].concat(entryData)
                    }
                },
            )

            let summedResults: { [key: string]: SalesRollupType } = {}
            groupedSales[groupKey].reduce((res, value: SalesRollupType) => {
                if (!summedResults[value.date]) {
                    summedResults[value.date] = { ...value }
                    summedResults[value.date].totalSales = 0
                    summedResults[value.date].averageUnitPrice = 0
                }

                summedResults[value.date].totalSales += value.totalSales
                summedResults[value.date].averageUnitPrice +=
                    value.averageUnitPrice
                return res
            })

            groupedSales[groupKey] = Object.entries(summedResults)
                .map(([date, rollup]) => {
                    return rollup
                })
                .sort((a, b) => {
                    return a.date <= b.date ? -1 : 1
                })
        })

        return groupedSales
    }

    const iterateSelectedGroupIndex = (step: number) => {
        let newSelectedGroupIndex = selectedGroupIndex + step
        if (newSelectedGroupIndex < 0) {
            newSelectedGroupIndex = trend.groupedSlugs!.length - 1
        } else if (newSelectedGroupIndex >= trend.groupedSlugs!.length) {
            newSelectedGroupIndex = 0
        }

        const referenceArray = !isStacked
            ? filteredData
            : getSummedDataByGroup(filteredData)
        const referenceKey = !isStacked
            ? item.slug
            : `group_${newSelectedGroupIndex}`
        const lastReferenceRollup =
            referenceArray[referenceKey][
                referenceArray[referenceKey].length - 1
            ]

        setSelectedGroupIndex(newSelectedGroupIndex)
        onDataPointChanged(lastReferenceRollup)
    }

    const getGroupLabelFromIndex = (index: number) => {
        if (trend.groupDetails!.length - 1 < index) {
            return `TODO - Group #${index}`
        }

        return trend.groupDetails![index].label
    }

    const getReferenceChartDescription = () => {
        if (trend.groupedSlugs!.length <= 1) {
            return ''
        }

        return `
            For added reference, the ${isDelta ? 'change in' : ''}
            ${isStacked ? 'summed' : 'individual'}
            ${currentStat == 'average' ? 'net worth' : 'total sales'}
            for ${trend
                .groupedSlugs!.map((slugs, index) => {
                    return index != selectedGroupIndex
                        ? getGroupLabelFromIndex(index)
                        : ''
                })
                .join(', ')
                .replace(', ', ' ')}
            is provided as a faded line.
        `
    }

    const getChartDescription = () => {
        return `
            This chart shows the ${isDelta ? 'change in' : ''}
            ${isStacked ? 'summed' : 'individual'}
            ${currentStat == 'average' ? 'net worth' : 'total sales'}
            over time for
            ${getGroupLabelFromIndex(selectedGroupIndex)}.
            ${getReferenceChartDescription()}
            The graph above maps price trends for the grouped items in
            relation to one another. Use this to identify broad trends
            and plan accordingly. To better guide you, this
            description will update as you play with the trend graph.
        `
    }

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
                        {currentStat == 'average' ? 'Net Worth' : 'Total Sales'}
                    </div>

                    <div className="tradable-item-header-price">
                        {Math.round(
                            currentStat == 'average'
                                ? averagePrice
                                : totalSales,
                        ).toLocaleString()}
                    </div>

                    <div className="tradable-item-header-date">
                        as of {currentDate}
                    </div>
                </div>

                <div className="tradable-item-toggle-container">
                    <div
                        className="tradable-item-header-graph-toggle-group"
                        onClick={() => {
                            toggleIsStacked()
                        }}
                    >
                        <div
                            className={`tradable-item-header-graph-toggle is-action ${
                                isStacked ? 'is-active' : ''
                            }`}
                        >
                            <IonIcon icon={menuOutline}></IonIcon>

                            {isStacked && (
                                <div className="tradable-item-header-graph-toggle-label">
                                    Summed
                                </div>
                            )}
                        </div>

                        <div
                            className={`tradable-item-header-graph-toggle ${
                                !isStacked ? 'is-active' : ''
                            }`}
                        >
                            <IonIcon icon={analyticsOutline}></IonIcon>

                            {!isStacked && (
                                <div className="tradable-item-header-graph-toggle-label">
                                    Individual
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {enableSales && (
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
                                ? 'Net Worth'
                                : 'Total Sales'}
                        </div>

                        <div className="tradable-item-header-price">
                            {Math.round(
                                currentStat != 'average'
                                    ? averagePrice
                                    : totalSales,
                            ).toLocaleString()}
                        </div>
                    </div>
                )}

                <div className="tradable-item-header-graph">
                    {/*{filteredData[item.slug].length <= 1 && (
                        <div className="tradable-item-header-graph-empty">
                            Limited Sales Data Available
                        </div>
                    )}*/}

                    {chartIsRendered && (
                        <SalesChart
                            startDate={startDate}
                            groupedKeys={trend.groupedSlugs}
                            data={
                                !isStacked
                                    ? filteredData
                                    : getSummedDataByGroup(filteredData)
                            }
                            selectedKey={
                                !isStacked
                                    ? item.slug
                                    : `group_${selectedGroupIndex}`
                            }
                            onDataPointChanged={onDataPointChanged}
                            onDataPointReleased={onDataPointReleased}
                            currentStat={currentStat}
                            enableSales={enableSales}
                            isStacked={isStacked}
                            isDelta={isDelta}
                            markedDates={trend.markedDates}
                            enableAnnotations={enableAnnotations}
                            additionallyHighlightedKeys={trend.groupedSlugs![
                                selectedGroupIndex
                            ].concat([`group_${selectedGroupIndex}`])}
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
                {trend.groupedSlugs!.length > 1 && (
                    <div className="tradable-item-content-header is-selector">
                        <div
                            className="tradable-item-content-header-arrow"
                            onClick={() => {
                                iterateSelectedGroupIndex(-1)
                            }}
                        >
                            <IonIcon icon={arrowBack}></IonIcon>
                        </div>

                        <div className="tradable-item-content-header-text">
                            <div className="tradable-item-content-header-title is-centered">
                                {getGroupLabelFromIndex(selectedGroupIndex)}
                            </div>
                        </div>

                        <div
                            className="tradable-item-content-header-arrow"
                            onClick={() => {
                                iterateSelectedGroupIndex(1)
                            }}
                        >
                            <IonIcon icon={arrowForward}></IonIcon>
                        </div>
                    </div>
                )}

                <LoadingSkeleton
                    error={false}
                    loading={false}
                    title="What am I looking at?"
                    message={getChartDescription()}
                    showIcon={false}
                />

                {trend.groupedSlugs!.map((slugs, index) => {
                    return (
                        <div key={`group-selection-${index}`}>
                            {trend.groupedSlugs!.length > 1 && (
                                <div className="tradable-item-content-header">
                                    <div className="tradable-item-content-header-text">
                                        <div className="tradable-item-content-header-title">
                                            {getGroupLabelFromIndex(index)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {items
                                .filter((i) => {
                                    return slugs.includes(i.slug)
                                })
                                .map((i, itemIndex) => {
                                    return (
                                        <TradableItemReference
                                            key={`group-selection-${index}-item-${itemIndex}`}
                                            item={i}
                                            disableClick={true}
                                        />
                                    )
                                })}
                        </div>
                    )
                })}

                {trend.dateDetails!.length > 0 && (
                    <div className="tradable-item-content-header">
                        <div className="tradable-item-content-header-text">
                            <div className="tradable-item-content-header-title">
                                Marked Dates
                            </div>
                        </div>
                    </div>
                )}

                {trend.dateDetails!.map((dateBreakdown, index) => {
                    return (
                        <div key={`marked-date-${index}`}>
                            {dateBreakdown.date!} - {dateBreakdown.label!}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Trend
