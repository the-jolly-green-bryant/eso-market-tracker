import {
  Chart as ChartJS,
  CategoryScale,
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
import { Line } from 'react-chartjs-2'
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
  AnnotationPlugin
)

ChartJS.register({
  id: 'salesChart',
  afterEvent: (chart, args, options) => {
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

const getDeltaValue = (
  data: SalesRollupType[],
  index: number,
  targetStat: 'average' | 'sales'
) => {
  if (index == 0) {
    return 0
  }

  const targetRollup = data.at(index)!
  const precedingRollup = data.at(index - 1)!
  return targetStat == 'average'
    ? targetRollup.averageUnitPrice - precedingRollup.averageUnitPrice
    : targetRollup.totalSales - precedingRollup.totalSales
}

const MISSING_START_DATE = new Date('2022-08-16')
const MISSING_END_DATE = new Date('2023-05-23')

const _getDataGapAnnotation = (startDate: Date) => {
  // If our start date is before our known gap, display an annotation for the
  //  missing data.

  const containsStart = startDate.getTime() < MISSING_START_DATE.getTime()
  const containsEnd =
    startDate.getTime() > MISSING_START_DATE.getTime() &&
    startDate.getTime() < MISSING_END_DATE.getTime()

  if (!containsStart && !containsEnd) {
    return []
  }

  return [
    {
      type: 'box',
      yScaleID: 'y',
      xScaleID: 'x',
      backgroundColor: '#282B2D',
      borderWidth: 0,
      xMin: containsStart ? MISSING_START_DATE : undefined,
      xMax: MISSING_END_DATE,
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
      xMin: MISSING_END_DATE,
      xMax: MISSING_END_DATE,
      borderColor: '#f3f3f84d',
    },
    ...(containsStart
      ? [
          {
            type: 'line',
            mode: 'horizontal',
            yScaleID: 'y',
            xScaleID: 'x',
            backgroundColor: 'transparent',
            borderDash: [10, 10],
            xMin: MISSING_START_DATE,
            xMax: MISSING_START_DATE,
            borderColor: '#f3f3f84d',
          },
        ]
      : []),
  ]
}

const _getMissingDataAnnotation =
  (
    data: Record<string, SalesRollupType[]>,
    currentStat: 'average' | 'sales',
    startDate: Date,
    isDelta: boolean,
    currentStatInverse: 'average' | 'sales'
  ) =>
  (key: string) => {
    const initialSales = data[key].at(0)?.totalSales
    const initialAverage = data[key].at(0)?.averageUnitPrice
    const initialStatInverse =
      currentStat != 'average' ? initialAverage : initialSales
    const initialStat = currentStat == 'average' ? initialAverage : initialSales

    if (
      data[key].length ||
      startDate.getTime() != new Date(data[key][0].date).getTime()
    ) {
      return []
    }

    return [
      // Annotation is start date to first data point.
      {
        type: 'line',
        mode: 'horizontal',
        yScaleID: 'y',
        xScaleID: 'x',
        borderDash: [4, 4],
        value: !isDelta
          ? initialStat
          : getDeltaValue(data[key], 0, currentStat),
        xMin: startDate,
        xMax: data[key][0].date,
        yMin: !isDelta ? initialStat : getDeltaValue(data[key], 0, currentStat),
        yMax: !isDelta ? initialStat : getDeltaValue(data[key], 0, currentStat),
        borderColor: '#f3f3f84d',
        label: {
          color: '#f3f3f84d',
          backgroundColor: '#282B2D',
          display: MISSING_START_DATE <= new Date(data[key][0].date),
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
          ? initialStatInverse
          : getDeltaValue(data[key], 0, currentStatInverse),
        xMin: startDate,
        xMax: data[key][0].date,
        yMin: !isDelta
          ? initialStatInverse
          : getDeltaValue(data[key], 0, currentStatInverse),
        yMax: !isDelta
          ? initialStatInverse
          : getDeltaValue(data[key], 0, currentStatInverse),
        borderColor: '#f3f3f84d',
        label: {
          color: '#f3f3f84d',
          backgroundColor: '#282B2D',
          display: MISSING_START_DATE <= new Date(data[key][0].date),
          position: 'top',
        },
      },
    ]
  }

const _getScales = (startDate: Date) => ({
  x: { display: false, min: startDate, type: 'time' },
  y: { display: false, stacked: false, ticks: { beginAtZero: false } },
  y1: { type: 'linear', display: false },
})

const COMMON_CHART_OPTIONS = {
  interaction: { mode: 'nearest' as const },
  responsive: true,
  animation: false,
  maintainAspectRatio: false,
  elements: { point: { radius: 0 } },
  events: [
    'mouseup' as const,
    'mousedown' as const,
    'mousemove' as const,
    'touchstart' as const,
    'touchmove' as const,
    'touchend' as const,
    'click' as const,
  ],
}

const _getSalesColor =
  (currentStat: 'average' | 'sales') => (rollups: SalesRollupType[]) => {
    const salesUp =
      currentStat == 'average'
        ? rollups[0].averageUnitPrice <
          rollups[rollups.length - 1].averageUnitPrice
        : rollups[0].totalSales < rollups[rollups.length - 1].totalSales

    return salesUp ? '#7dc579' : '#ff8181'
  }

const useGraphInteractions = (
  data: Record<string, SalesRollupType[]>,
  selectedKey: string,
  onDataPointChanged?: (arg0: SalesRollupType) => void,
  onDataPointReleased?: () => void
) => {
  const chartRef = useRef<React.ComponentRef<typeof Line>>()
  const [mouseIsDown, setMouseIsDown] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<SalesRollupType | null>(
    null
  )

  const onSelectDataPoint = (point: SalesRollupType) => {
    // Renders a line at our nearest point and updates our display.
    setSelectedPoint(point)
    onDataPointChanged && onDataPointChanged(point)
  }

  const onDeselectPoint = () => {
    // Returns our chart to its original state.
    setMouseIsDown(false)
    setSelectedPoint(null)
    return onDataPointReleased && onDataPointReleased()
  }

  const onMouseDown = (e: Event) => {
    setMouseIsDown(true)
    const chart = chartRef.current!
    const nearestPoint = chart
      .getElementsAtEventForMode(e, 'index', { intersect: false }, false)
      .at(0)!
    const nearestData = data[selectedKey][nearestPoint.index]
    onSelectDataPoint(nearestData)
  }

  const onMouseUp = () => (setMouseIsDown(false), onDeselectPoint())
  const onMouseMove = (e: Event) => {
    if (!mouseIsDown) {
      return
    }

    const chart = chartRef.current!
    const nearestPoint = chart
      .getElementsAtEventForMode(e, 'index', { intersect: false }, false)
      .at(0)!
    const nearestData = data[selectedKey][nearestPoint.index]
    onSelectDataPoint(nearestData)
  }

  return {
    mouseIsDown,
    selectedPoint,
    onSelectDataPoint,
    onDeselectPoint,
    setMouseIsDown,
    chartRef,
    onMouseDown,
    onMouseUp,
    onMouseMove,
  }
}

const _dataPointAnnotation = (selectedPoint: SalesRollupType | null) =>
  selectedPoint
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
    : []

// eslint-disable-next-line max-lines-per-function -- max: 100
export default ({
  startDate,
  data,
  selectedKey,
  currentStat = 'average',
  isDelta = false,
  onDataPointChanged,
  onDataPointReleased,
}: {
  startDate: Date
  data: Record<string, SalesRollupType[]>
  selectedKey: string
  currentStat?: 'average' | 'sales'
  isDelta?: boolean
  onDataPointChanged?: (point: SalesRollupType) => void
  onDataPointReleased?: () => void
}) => {
  const currentStatInverse = currentStat == 'average' ? 'sales' : 'average'
  const {
    mouseIsDown,
    selectedPoint,
    onDeselectPoint,
    chartRef,
    onMouseDown,
    onMouseUp,
    onMouseMove,
  } = useGraphInteractions(
    data,
    selectedKey,
    onDataPointChanged,
    onDataPointReleased
  )

  const getMissingDataAnnotation = _getMissingDataAnnotation(
    data,
    currentStat,
    startDate,
    isDelta,
    currentStatInverse
  )

  const getAnnotations = () => [
    ...Object.keys(data).flatMap((key) => getMissingDataAnnotation(key)),
    ...(mouseIsDown ? [..._dataPointAnnotation(selectedPoint)] : []),
    ..._getDataGapAnnotation(startDate),
  ]

  const chartOptions = {
    ...COMMON_CHART_OPTIONS,
    plugins: {
      annotation: { annotations: getAnnotations() },
      legend: { display: false },
      salesChart: { onMouseDown, onMouseUp, onMouseMove },
    },
    scales: _getScales(startDate),
  }

  const getPreferredValue = (ifAvg: number, ifTotal: number, ifDelta: number) =>
    (isDelta && ifDelta) ||
    Math.round(currentStat == 'average' ? ifAvg : ifTotal)

  const _formatData = (keyedData: SalesRollupType[]) =>
    keyedData.map((rollup, index) => ({
      x: rollup.date,
      y: getPreferredValue(
        rollup.averageUnitPrice,
        rollup.totalSales,
        getDeltaValue(keyedData, index, currentStat)
      ),
    }))

  return (
    <div className="sales-chart">
      <Line
        ref={chartRef}
        onClick={onDeselectPoint}
        // @ts-expect-error -- Chart options can be clarified at a later point.
        options={chartOptions}
        data={{
          labels: data[selectedKey].map((rollup) => rollup.date),
          datasets: Object.values(data).map((keyedData) => ({
            label: 'Dataset 1',
            data: _formatData(keyedData),
            borderColor: _getSalesColor(currentStat)(keyedData),
            borderDash: new Array<number>(),
            yAxisID: 'y',
          })),
        }}
      />
    </div>
  )
}
