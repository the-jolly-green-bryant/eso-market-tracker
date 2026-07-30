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
  Filler,
  ScriptableContext,
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
  Filler,
  AnnotationPlugin,
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

const getDeltaValue = (data: SalesRollupType[], index: number) => {
  if (index == 0) {
    return 0
  }

  const targetRollup = data.at(index)!
  const precedingRollup = data.at(index - 1)!
  return targetRollup.averageUnitPrice - precedingRollup.averageUnitPrice
}

const DATA_GAPS = [
  [new Date('2022-08-16'), new Date('2023-05-23')],
  [new Date('2024-11-15'), new Date('2025-07-10')],
] as const

const _getDataGapAnnotation = (
  startDate: Date,
  [missingStartDate, missingEndDate]: (typeof DATA_GAPS)[number],
) => {
  // If our start date is before our known gap, display an annotation for the
  //  missing data.

  const containsStart = startDate.getTime() < missingStartDate.getTime()
  const containsEnd =
    startDate.getTime() > missingStartDate.getTime() &&
    startDate.getTime() < missingEndDate.getTime()

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
      xMin: containsStart ? missingStartDate : undefined,
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
    ...(containsStart
      ? [
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
        ]
      : []),
  ]
}

const _getScales = (startDate: Date) => ({
  x: {
    display: false,
    min: startDate,
    type: 'time',
    grid: { display: false },
  },
  y: {
    display: false,
    stacked: false,
    grace: '12%',
    grid: { display: false },
    ticks: { beginAtZero: false },
  },
})

const COMMON_CHART_OPTIONS = {
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
  responsive: true,
  animation: false,
  maintainAspectRatio: false,
  elements: {
    line: {
      borderCapStyle: 'round' as const,
      borderJoinStyle: 'round' as const,
      borderWidth: 2,
      tension: 0,
    },
    point: {
      hitRadius: 18,
      hoverRadius: 0,
      radius: 0,
    },
  },
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

const _getPriceColor = (rollups: SalesRollupType[]) =>
  rollups[0].averageUnitPrice < rollups[rollups.length - 1].averageUnitPrice
    ? '#59c778'
    : '#ee695e'

const _getChartFill =
  (color: string) => (context: ScriptableContext<'line'>) => {
    const { chart } = context
    const { ctx, chartArea } = chart
    const gradient = ctx.createLinearGradient(
      0,
      chartArea?.top ?? 0,
      0,
      chartArea?.bottom ?? chart.height,
    )
    gradient.addColorStop(0, `${color}48`)
    gradient.addColorStop(0.55, `${color}1c`)
    gradient.addColorStop(1, `${color}00`)
    return gradient
  }

const useGraphInteractions = (
  data: Record<string, SalesRollupType[]>,
  selectedKey: string,
  onDataPointChanged?: (arg0: SalesRollupType) => void,
  onDataPointReleased?: () => void,
) => {
  const chartRef = useRef<React.ComponentRef<typeof Line>>()
  const [mouseIsDown, setMouseIsDown] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<SalesRollupType | null>(
    null,
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

/* eslint-disable max-lines-per-function -- chart assembly is intentionally cohesive */
export default ({
  startDate,
  data,
  selectedKey,
  isDelta = false,
  onDataPointChanged,
  onDataPointReleased,
}: {
  startDate: Date
  data: Record<string, SalesRollupType[]>
  selectedKey: string
  isDelta?: boolean
  onDataPointChanged?: (point: SalesRollupType) => void
  onDataPointReleased?: () => void
}) => {
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
    onDataPointReleased,
  )

  const getAnnotations = () => [
    ...(mouseIsDown ? [..._dataPointAnnotation(selectedPoint)] : []),
    ...DATA_GAPS.flatMap((gap) => _getDataGapAnnotation(startDate, gap)),
  ]

  const chartOptions = {
    ...COMMON_CHART_OPTIONS,
    plugins: {
      annotation: { annotations: getAnnotations() },
      legend: { display: false },
      tooltip: { enabled: false },
      salesChart: { onMouseDown, onMouseUp, onMouseMove },
    },
    scales: _getScales(startDate),
  }

  const getPreferredValue = (average: number, delta: number) =>
    isDelta ? delta : Math.round(average)

  const _formatData = (keyedData: SalesRollupType[]) =>
    keyedData.map((rollup, index) => ({
      x: rollup.date,
      y: getPreferredValue(
        rollup.averageUnitPrice,
        getDeltaValue(keyedData, index),
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
          datasets: Object.values(data).map((keyedData) => {
            const color = _getPriceColor(keyedData)
            return {
              label: 'Price history',
              data: _formatData(keyedData),
              backgroundColor: _getChartFill(color),
              borderColor: color,
              borderDash: new Array<number>(),
              fill: 'start',
              yAxisID: 'y',
            }
          }),
        }}
      />
    </div>
  )
}
/* eslint-enable max-lines-per-function */
