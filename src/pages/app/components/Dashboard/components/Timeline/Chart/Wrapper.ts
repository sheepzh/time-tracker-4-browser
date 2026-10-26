import { t } from '@app/locale'
import { getSeriesPalette, tooltipDot } from '@app/util/echarts'
import { EchartsWrapper } from '@hooks'
import { getPrimaryTextColor } from '@pages/util/style'
import { groupBy, toMap } from '@util/array'
import DateIterator from '@util/date-iterator'
import { CATE_NOT_SET_ID } from '@util/site'
import {
    formatPeriodCommon, getStartOfDay, getStartOfNextDay, MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND
} from '@util/time'
import type {
    ComposeOption, CustomSeriesOption, CustomSeriesRenderItem, DataZoomComponentOption, GridComponentOption,
    LegendComponentOption, TooltipComponentOption,
} from 'echarts'
import { graphic } from "echarts/core"
import { formatYAxis } from '../common'

export type BizData = {
    activities: tt4b.timeline.Activity[]
    merge: tt4b.timeline.MergeMethod
    dates: string[]
}

const CLOCK_END = 24 * MILL_PER_HOUR

export type EcOption = ComposeOption<
    | CustomSeriesOption
    | GridComponentOption
    | TooltipComponentOption
    | LegendComponentOption
    | DataZoomComponentOption
>

type MyValue = [
    yIndex: number,
    start: number, // milliseconds, offset of this day
    end: number, // milliseconds, offset of this day
    duration: number,
]

const formatTimeLabel = (val: number) => [val / MILL_PER_HOUR, val / MILL_PER_MINUTE % 60]
    .map(value => Math.floor(value).toString().padStart(2, '0'))
    .join(':')

const formatStart = (startMs: number): string => {
    const second = Math.floor(startMs / MILL_PER_SECOND) % 60
    return `${formatTimeLabel(startMs)}:${second.toString().padStart(2, '0')}`
}

const formatDuration = (duration: number): string => {
    if (duration < MILL_PER_SECOND) {
        return `${duration}ms`
    } else if (duration < MILL_PER_SECOND * 10) {
        return `${(duration / MILL_PER_SECOND).toFixed(1)}s`
    } else {
        return formatPeriodCommon(duration)
    }
}

const LEGEND_WIDTH = 180

const renderItem: CustomSeriesRenderItem = (params, api) => {
    const categoryIndex = api.value(0)
    const [sX = 0, sY = 0] = api.coord([api.value(1), categoryIndex])
    const [eX = 0] = api.coord([api.value(2), categoryIndex])

    const size = api.size?.([0, 1])
    const height = ((Array.isArray(size) ? size[1] : size) ?? 0) * 0.6

    const coordSys = params.coordSys as unknown as Parameters<typeof graphic.clipRectByRect>[1]

    var rectShape = graphic.clipRectByRect({
        x: sX,
        y: sY - height / 2,
        width: eX - sX,
        height
    }, coordSys)

    return rectShape && {
        type: 'rect',
        transition: ['shape', 'style'],
        shape: rectShape,
        style: {
            fill: api.visual('color'),
        },
        focus: 'series',
    }
}

const clockTimeOf = (time: number): number => {
    const date = new Date(time)
    return date.getHours() * MILL_PER_HOUR + date.getMinutes() * MILL_PER_MINUTE
        + date.getSeconds() * MILL_PER_SECOND + date.getMilliseconds()
}

const collectDayPeriods = (start: number) => {
    const end = getStartOfNextDay(start)
    const periods: [start: number, end: number][] = []
    let periodStart = start
    let cursor = start
    let offset = new Date(start).getTimezoneOffset()
    let repeated = false
    while (cursor < end) {
        const next = Math.min(cursor + MILL_PER_HOUR, end)
        if (new Date(next - 1).getTimezoneOffset() === offset) {
            cursor = next
            continue
        }
        let low = cursor
        let high = next - 1
        while (low < high) {
            const middle = Math.floor((low + high) / 2)
            if (new Date(middle).getTimezoneOffset() === offset) low = middle + 1
            else high = middle
        }
        const nextOffset = new Date(low).getTimezoneOffset()
        repeated ||= nextOffset > offset
        periods.push([periodStart, low])
        periodStart = cursor = low
        offset = nextOffset
    }
    periods.push([periodStart, end])
    return repeated ? periods.map(period => [period]) : [periods]
}

const calcDataZoomDefaultRange = (series: { data: MyValue[] }[]): [start: number, end: number] => {
    if (!series.length) return [0, CLOCK_END]
    const [min, max] = series.reduce<[number, number]>((range, { data }) =>
        data.reduce<[number, number]>(([min, max], value) =>
            [Math.min(min, value[1]), Math.max(max, value[2])], range), [CLOCK_END, 0])
    const interval = 30 * MILL_PER_MINUTE
    return [Math.max(0, Math.floor(min / interval) * interval), Math.min(CLOCK_END, Math.ceil(max / interval) * interval)]
}

const collectChartData = ({ activities, dates, merge }: BizData) => {
    const dayStarts = activities.flatMap(({ start, duration }) => {
        const end = start + duration
        if (!(start < end)) return []
        const from = new Date(getStartOfDay(start))
        return [...DateIterator.of(from, new Date(end - 1), getStartOfDay)]
    })
    const periodsByDate = toMap([...new Set(dayStarts)], formatYAxis, collectDayPeriods)
    const rows = dates.flatMap(date =>
        (periodsByDate[date] ?? [[]]).map(periods => ({ date, periods })))
    const groups = groupBy(activities, activity => activity.seriesKey, list => ({
        list,
        total: list.reduce((total, activity) => total + activity.duration, 0),
    }))
    const colors = getSeriesPalette()
    const legendData = Object.entries(groups)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([key, { list }], index) => ({
            name: key,
            displayName: merge === 'cate' && key === String(CATE_NOT_SET_ID)
                ? t(msg => msg.shared.cate.notSet)
                : list.at(-1)?.seriesName,
            color: colors[index % (colors.length || 1)] ?? '#000',
        }))
    const legendMap = toMap(legendData, legend => legend.name)
    const series = Object.entries(groups).map(([key, { list }]) => ({
        name: key,
        type: 'custom',
        id: `${merge}-${key}`,
        itemStyle: { color: legendMap[key]?.color },
        encode: {
            x: [1, 2],
            y: 0,
        },
        renderItem,
        selectedMode: true,
        data: rows.flatMap(({ periods }, yIndex) => periods.flatMap(([from, to]) => list.flatMap<MyValue>(activity => {
            const start = Math.max(activity.start, from)
            const duration = Math.min(activity.start + activity.duration, to) - start
            if (!(duration > 0)) return []
            const clockStart = clockTimeOf(start)
            return [[yIndex, clockStart, clockStart + duration, duration]]
        }))),
    } satisfies CustomSeriesOption)).filter(series => series.data.length)
    return { dates: rows.map(row => row.date), series, legendData, legendMap }
}

class Wrapper extends EchartsWrapper<BizData, EcOption> {
    protected override replaceSeries: boolean = true
    protected override isSizeSensitize: boolean = true

    protected async generateOption(bizData: BizData): Promise<EcOption> {
        const { merge } = bizData
        const domWidth = this.getDomWidth()
        const gridLeft = Math.min(Math.max(30, domWidth * .05), 60)
        const primaryTextColor = getPrimaryTextColor()

        const { dates, series, legendData, legendMap } = collectChartData(bizData)

        const tooltipSeriesName = (key: string | undefined) => {
            if (!key) return ''
            const name = legendMap[key]?.displayName
            if (merge === 'cate') return name ?? key
            return name ? `${name} (${key})` : key
        }

        const [zoomStart, zoomEnd] = calcDataZoomDefaultRange(series)

        return {
            grid: {
                left: gridLeft, width: domWidth - gridLeft - LEGEND_WIDTH,
                bottom: '35%', height: '60%',
            },
            dataZoom: {
                type: 'slider',
                filterMode: 'weakFilter',
                borderColor: 'transparent',
                bottom: 5,
                height: 20,
                labelFormatter: '',
                handleStyle: { opacity: 0 },
                startValue: zoomStart,
                endValue: zoomEnd,
            },
            yAxis: {
                type: 'category',
                data: dates,
                axisTick: {
                    show: false,
                },
                axisLine: { show: false, },
                axisLabel: { color: primaryTextColor }
            },
            xAxis: {
                type: 'value',
                offset: 0,
                min: 0,
                max: CLOCK_END,
                minInterval: 10 * MILL_PER_MINUTE,
                interval: 4 * MILL_PER_HOUR,
                axisLabel: {
                    formatter: formatTimeLabel,
                    color: primaryTextColor,
                },
                splitLine: { show: false },
            },
            tooltip: {
                position: 'top',
                borderWidth: 0,
                formatter: params => {
                    const param = Array.isArray(params) ? params[0] : params
                    if (!param) return ''
                    const { value, seriesName, color } = param
                    const [, start, , duration] = value as MyValue
                    const rangeStr = `${formatStart(start)} ~ ${formatDuration(duration)}`
                    return `${tooltipDot(color)} ${tooltipSeriesName(seriesName)}<br/>${rangeStr}`
                },
            },
            series,
            legend: {
                type: 'scroll',
                orient: 'vertical',
                align: 'left',
                top: '6%',
                right: 0,
                textStyle: {
                    width: 120,
                    color: primaryTextColor,
                    overflow: 'truncate',
                },
                itemWidth: 20,
                data: legendData.map(({ name, color }) => ({
                    name,
                    itemStyle: { color },
                })),
                formatter: name => legendMap[name]?.displayName ?? name,
            }
        }
    }
}

export default Wrapper