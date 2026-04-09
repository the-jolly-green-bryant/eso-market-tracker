import {
    Chart as ChartJS,
    CategoryScale,
    ChartOptions,
    LinearScale,
    PointElement,
    BarElement,
    LineElement,
    Title,
    TimeScale,
    Tooltip,
    Legend,
} from 'chart.js'
import AnnotationPlugin from 'chartjs-plugin-annotation'
import 'chartjs-adapter-luxon'
import { useRef, useState } from 'react'
import { Line, getElementAtEvent } from 'react-chartjs-2'
import { SalesRollupType } from '../models/tradable-item-types'
import './SalesChart.scss'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    LineElement,
    Title,
    TimeScale,
    Tooltip,
    Legend,
    AnnotationPlugin,
)

ChartJS.register({
    id: 'salesChart',
    afterEvent: function (chart, args, options) {
        const e = args.event
        if (e.type == 'mouseup' || e.type == 'click') {
            return options.onMouseUp(e)
        }

        if (e.type == 'mousedown') {
            return options.onMouseDown(e)
        }

        if (e.type == 'mousemove') {
            return options.onMouseMove(e)
        }

        console.log('Unhandled event type:', e.type)
    },
})

interface ContainerProps {
    startDate: Date
    data: { [key: string]: SalesRollupType[] }
    selectedKey: string
    currentStat?: 'average' | 'sales'
    enableSales?: boolean
    isStacked?: boolean
    isDelta?: boolean
    markedDates?: string[]
    groupedKeys?: string[][] | null
    enableAnnotations?: boolean
    additionallyHighlightedKeys?: string[]
    onDataPointChanged?: (point: SalesRollupType) => void
    onDataPointReleased?: () => void
}

const SalesChart: React.FC<ContainerProps> = ({
    startDate,
    data,
    selectedKey,
    currentStat = 'average',
    enableSales = true,
    isStacked = false,
    isDelta = false,
    markedDates = [],
    groupedKeys = null,
    enableAnnotations = true,
    additionallyHighlightedKeys = [],
    onDataPointChanged = null,
    onDataPointReleased = null,
}) => {
    const [mouseIsDown, setMouseIsDown] = useState(false)
    const [selectedPoint, setSelectedPoint] = useState<SalesRollupType | null>(
        null,
    )
    const chartRef = useRef<any>()

    const missingStartDate = new Date('2022-08-16')
    const missingEndDate = new Date('2023-05-23')

    const getNearestDataPointFromEvent = (e: any) => {
        /* Gets the data point that's nearest to our click event. */

        const chart = chartRef.current
        const elements = chart!.getElementsAtEventForMode(
            e,
            'index',
            { intersect: false },
            false,
        )
        const nearestPoint = elements.length ? elements[0] : null
        // TODO
        return nearestPoint != null
            ? data[selectedKey][nearestPoint.index]
            : null
    }

    const getDeltaValue = (
        data: SalesRollupType[],
        index: number,
        targetStat: 'average' | 'sales',
    ) => {
        if (index == 0) {
            return 0
        }

        const targetRollup = data[index]
        const precedingRollup = data[index - 1]
        const change =
            targetStat == 'average'
                ? targetRollup.averageUnitPrice -
                  precedingRollup.averageUnitPrice
                : targetRollup.totalSales - precedingRollup.totalSales

        return change
    }

    const onSelectDataPoint = (point: SalesRollupType) => {
        /* Renders a line at our nearest point and updates our display. */

        setSelectedPoint(point)
        if (onDataPointChanged) {
            onDataPointChanged(point)
        }
    }

    const onDeselectPoint = () => {
        /* Returns our chart to its original state. */

        setMouseIsDown(false)
        setSelectedPoint(null)
        if (onDataPointReleased) {
            onDataPointReleased()
        }
    }

    const getDataGapAnnotation = () => {
        // If our start date is before our known gap, display an
        // annotation for the missing data.

        if (startDate.getTime() < missingStartDate.getTime()) {
            return [
                {
                    type: 'box',
                    yScaleID: 'y',
                    xScaleID: 'x',
                    backgroundColor: '#282B2D',
                    borderWidth: 0,
                    xMin: missingStartDate,
                    xMax: missingEndDate,
                    label: {
                        color: '#f3f3f84d',
                        backgroundColor: '#282B2D',
                        content: 'NO DATA',
                        display: true,
                        position: 'center',
                        textAlign: 'center',
                    },
                },
                {
                    type: 'line',
                    mode: 'horizontal',
                    yScaleID: 'y',
                    xScaleID: 'x',
                    backgroundColor: 'transparent',
                    borderDash: [10, 10],
                    xMin: missingStartDate,
                    xMax: missingStartDate,
                    borderColor: '#f3f3f84d',
                },
                {
                    type: 'line',
                    mode: 'horizontal',
                    yScaleID: 'y',
                    xScaleID: 'x',
                    backgroundColor: 'transparent',
                    borderDash: [10, 10],
                    xMin: missingEndDate,
                    xMax: missingEndDate,
                    borderColor: '#f3f3f84d',
                },
            ]
        }

        if (
            startDate.getTime() > missingStartDate.getTime() &&
            startDate.getTime() < missingEndDate.getTime()
        ) {
            return [
                {
                    type: 'box',
                    yScaleID: 'y',
                    xScaleID: 'x',
                    backgroundColor: '#282B2D',
                    borderWidth: 0,
                    xMax: missingEndDate,
                    label: {
                        color: '#f3f3f84d',
                        backgroundColor: '#282B2D',
                        content: 'NO DATA',
                        display: true,
                        position: 'center',
                        textAlign: 'center',
                    },
                },
                {
                    type: 'line',
                    mode: 'horizontal',
                    yScaleID: 'y',
                    xScaleID: 'x',
                    backgroundColor: 'transparent',
                    borderDash: [10, 10],
                    xMin: missingEndDate,
                    xMax: missingEndDate,
                    borderColor: '#f3f3f84d',
                },
            ]
        }

        return []
    }

    const getAllMissingDataAnnotations = (): any[] => {
        let annotations: any[] = []
        if (!enableAnnotations) {
            return annotations
        }

        Object.keys(data).forEach((key) => {
            const lineAnnotations = getMissingDataAnnotation(key)
            if (lineAnnotations.length) {
                annotations = annotations.concat(lineAnnotations)
            }
        })

        return annotations
    }

    const getMissingDataAnnotation = (key: string): any[] => {
        // If we don't have data for the start date, display an annotation.
        return data[key].length &&
            startDate.getTime() != new Date(data[key][0].date).getTime()
            ? [
                  // Annotation is start date to first data point.
                  {
                      type: 'line',
                      mode: 'horizontal',
                      yScaleID: 'y',
                      xScaleID: 'x',
                      borderDash: [4, 4],
                      value: !isDelta
                          ? currentStat == 'average'
                              ? data[key][0].averageUnitPrice
                              : data[key][0].totalSales
                          : getDeltaValue(data[key], 0, currentStat),
                      xMin: startDate,
                      xMax: data[key][0].date,
                      yMin: !isDelta
                          ? currentStat == 'average'
                              ? data[key][0].averageUnitPrice
                              : data[key][0].totalSales
                          : getDeltaValue(data[key], 0, currentStat),
                      yMax: !isDelta
                          ? currentStat == 'average'
                              ? data[key][0].averageUnitPrice
                              : data[key][0].totalSales
                          : getDeltaValue(data[key], 0, currentStat),
                      borderColor: '#f3f3f84d',
                      label: {
                          color: '#f3f3f84d',
                          backgroundColor: '#282B2D',
                          // content: 'NO DATA',
                          display:
                              missingStartDate <= new Date(data[key][0].date),
                          position: 'top',
                      },
                  },
                  // Add an annotation for the opposite graph as well.
                  {
                      type: 'line',
                      mode: 'horizontal',
                      yScaleID: 'y1',
                      xScaleID: 'x',
                      borderDash: [4, 4],
                      value: !isDelta
                          ? currentStat != 'average'
                              ? data[key][0].averageUnitPrice
                              : data[key][0].totalSales
                          : getDeltaValue(
                                data[key],
                                0,
                                currentStat == 'average' ? 'sales' : 'average',
                            ),
                      xMin: startDate,
                      xMax: data[key][0].date,
                      yMin: !isDelta
                          ? currentStat != 'average'
                              ? data[key][0].averageUnitPrice
                              : data[key][0].totalSales
                          : getDeltaValue(
                                data[key],
                                0,
                                currentStat == 'average' ? 'sales' : 'average',
                            ),
                      yMax: !isDelta
                          ? currentStat != 'average'
                              ? data[key][0].averageUnitPrice
                              : data[key][0].totalSales
                          : getDeltaValue(
                                data[key],
                                0,
                                currentStat == 'average' ? 'sales' : 'average',
                            ),
                      borderColor: '#f3f3f84d',
                      label: {
                          color: '#f3f3f84d',
                          backgroundColor: '#282B2D',
                          // content: 'NO DATA',
                          display:
                              missingStartDate <= new Date(data[key][0].date),
                          position: 'top',
                      },
                  },
              ]
            : []
    }

    const getExtremesForStat = (
        dataset: SalesRollupType[],
        stat: 'average' | 'sales',
    ) => {
        const values =
            stat == 'average'
                ? dataset.map((rollup) => {
                      return rollup.averageUnitPrice
                  })
                : dataset.map((rollup) => {
                      return rollup.totalSales
                  })

        return {
            max: Math.max(...values),
            min: Math.min(...values),
        }
    }

    // Initialize our scales.
    let scales: { [key: string]: any } = {
        x: {
            display: false,
            min: startDate,
            type: 'time',
        },
        y: {
            display: false,
            stacked: isStacked,
            ticks: {
                beginAtZero: false,
                // suggestedMin:
            },
        },
        y1: {
            type: 'linear',
            display: false,
        },
    }

    // Create a scale for each of our groups.
    if (groupedKeys && groupedKeys.length) {
        groupedKeys.forEach((keys, index) => {
            scales[`y_${index}`] = {
                display: false,
                stacked: isStacked,
                ticks: {
                    beginAtZero: false,
                    // suggestedMin:
                },
                keys: keys.concat(`group_${index}`),
                scaleId: `y_${index}`,
            }
        })
    }

    const chartOptions: any = {
        interaction: {
            mode: 'nearest',
        },
        responsive: true,
        // spanGaps: 1000 * 60 * 60 * 24 * 240, // 240 days
        animation: false,
        plugins: {
            annotation: {
                annotations: getAllMissingDataAnnotations()
                    .concat(
                        mouseIsDown && selectedPoint != null
                            ? [
                                  {
                                      type: 'line',
                                      mode: 'vertical',
                                      scaleID: 'x',
                                      value: selectedPoint.date,
                                      borderColor: '#f3f3f84d',
                                      label: {
                                          content: '2023-05-23',
                                          enabled: true,
                                          position: 'top',
                                      },
                                  },
                              ]
                            : [],
                    )
                    .concat(
                        markedDates.map((markedDate) => {
                            return {
                                type: 'line',
                                mode: 'vertical',
                                scaleID: 'x',
                                value: markedDate,
                                borderColor: '#f3f3f84d',
                                label: {
                                    content: markedDate,
                                    enabled: true,
                                    position: 'top',
                                },
                            }
                        }),
                    )
                    .concat(getDataGapAnnotation()),
            },
            legend: {
                display: false,
            },
            salesChart: {
                onMouseDown: (e: any) => {
                    setMouseIsDown(true)
                    const chart = chartRef.current
                    const elements = chart.getElementsAtEventForMode(
                        e,
                        'index',
                        { intersect: false },
                        false,
                    )
                    const nearestPoint = elements.length ? elements[0] : null
                    // TODO
                    const nearestData =
                        nearestPoint != null
                            ? data[selectedKey][nearestPoint.index]
                            : null
                    onSelectDataPoint(nearestData!)
                },
                onMouseUp: () => {
                    setMouseIsDown(false)
                    onDeselectPoint()
                },
                onMouseMove: (e: any) => {
                    if (!mouseIsDown) {
                        return
                    }

                    const chart = chartRef.current
                    const elements = chart.getElementsAtEventForMode(
                        e,
                        'index',
                        { intersect: false },
                        false,
                    )
                    const nearestPoint = elements.length ? elements[0] : null
                    const nearestData =
                        nearestPoint != null
                            ? data[selectedKey][nearestPoint.index]
                            : null
                    onSelectDataPoint(nearestData!)
                },
            },
        },
        maintainAspectRatio: false,
        scales: scales,
        elements: {
            point: {
                radius: 0,
            },
        },
        events: [
            'mouseup',
            'mousedown',
            'mousemove',
            'touchstart',
            'touchmove',
            'touchend',
            'click',
        ],
    }

    const salesAreUp =
        currentStat == 'average'
            ? data[selectedKey][0].averageUnitPrice <
              data[selectedKey][data[selectedKey].length - 1].averageUnitPrice
            : data[selectedKey][0].totalSales <
              data[selectedKey][data[selectedKey].length - 1].totalSales

    const getSalesAreUp = (rollups: SalesRollupType[]) => {
        return currentStat == 'average'
            ? rollups[0].averageUnitPrice <
                  rollups[rollups.length - 1].averageUnitPrice
            : rollups[0].totalSales < rollups[rollups.length - 1].totalSales
    }

    return (
        <div className="sales-chart">
            <Line
                ref={chartRef}
                onClick={onDeselectPoint}
                options={chartOptions}
                data={{
                    labels: data[selectedKey].map((rollup) => {
                        return rollup.date
                    }),
                    datasets: Object.entries(data)
                        .map(
                            ([key, keyedData]: [string, SalesRollupType[]]) => {
                                return {
                                    label: 'Dataset 1',
                                    data: keyedData.map((rollup, index) => {
                                        return {
                                            x: rollup.date,
                                            y: !isDelta
                                                ? Math.round(
                                                      currentStat == 'average'
                                                          ? rollup.averageUnitPrice
                                                          : rollup.totalSales,
                                                  )
                                                : getDeltaValue(
                                                      keyedData,
                                                      index,
                                                      currentStat,
                                                  ),
                                        }
                                    }),
                                    borderColor:
                                        (key == selectedKey &&
                                            !additionallyHighlightedKeys.length) ||
                                        additionallyHighlightedKeys.includes(
                                            key,
                                        )
                                            ? getSalesAreUp(keyedData)
                                                ? '#7dc579'
                                                : '#ff8181'
                                            : '#f3f3f84d',
                                    borderDash: new Array<number>(),
                                    yAxisID:
                                        !groupedKeys || !groupedKeys.length
                                            ? 'y'
                                            : Object.keys(scales)
                                                  .map((scaleId) => {
                                                      return scales[scaleId]
                                                  })
                                                  .find((scaleObject) => {
                                                      return (
                                                          scaleObject.keys &&
                                                          scaleObject.keys.includes(
                                                              key,
                                                          )
                                                      )
                                                  }).scaleId,
                                }
                            },
                        )
                        .concat(
                            enableSales
                                ? [
                                      {
                                          label:
                                              currentStat == 'average'
                                                  ? 'Total Sales'
                                                  : 'Average Price',
                                          data: data[selectedKey].map(
                                              (rollup, index) => {
                                                  return !isDelta
                                                      ? {
                                                            x: rollup.date,
                                                            y: Math.round(
                                                                currentStat ==
                                                                    'average'
                                                                    ? rollup.totalSales
                                                                    : rollup.averageUnitPrice,
                                                            ),
                                                        }
                                                      : {
                                                            x: rollup.date,
                                                            y: getDeltaValue(
                                                                data[
                                                                    selectedKey
                                                                ],
                                                                index,
                                                                currentStat ==
                                                                    'average'
                                                                    ? 'sales'
                                                                    : 'average',
                                                            ),
                                                        }
                                              },
                                          ),
                                          borderColor: '#f3f3f84d',
                                          borderDash: [2, 4],
                                          yAxisID: 'y1',
                                      },
                                  ]
                                : [],
                        ),
                }}
            />
        </div>
    )
}

export default SalesChart
