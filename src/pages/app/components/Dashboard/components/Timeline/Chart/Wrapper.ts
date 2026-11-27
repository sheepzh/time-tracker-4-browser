import { dateFmt, t, unitFmt } from '@app/locale'
import { getSeriesPalette, tooltipDot } from '@app/util/echarts'
import { EchartsWrapper } from '@hooks'
import { CONFINE_TOOLTIP_OPTION, getPrimaryTextColor } from '@pages/util/style'
import { fmtDur, MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND } from '@pages/util/time'
import { groupBy, toMap } from '@util/array'
import { CATE_NOT_SET_ID } from '@util/site'
import type {
    ComposeOption, CustomSeriesOption, CustomSeriesRenderItem, DataZoomComponentOption, GridComponentOption,
    LegendComponentOption, TooltipComponentOption,
} from 'echarts'
import { graphic } from "echarts/core"
import type { TimelineData } from '../context'

export type BizData = TimelineData & {
    merge: tt4b.timeline.MergeMethod
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

const formatTime = (val: number, incSec?: boolean) => {
    const hour = Math.floor(val / MILL_PER_HOUR) % 24
    const minute = Math.floor(val / MILL_PER_MINUTE) % 60
    const second = Math.floor(val / MILL_PER_SECOND) % 60
    const fmt = dateFmt({
        hourCycle: "h23",
        hour: "2-digit", minute: "2-digit", second: incSec ? "2-digit" : undefined,
    })
    return fmt.format(new Temporal.PlainTime(hour, minute, incSec ? second : undefined))
}

const formatDuration = (duration: number): string => {
    if (duration < MILL_PER_SECOND) {
        return unitFmt("millisecond").format(duration)
    } else if (duration < MILL_PER_SECOND * 10) {
        return unitFmt("second", 1).format(duration / MILL_PER_SECOND)
    } else {
        return fmtDur(duration)
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

const calcDataZoomDefaultRange = (series: { data: MyValue[] }[]): [start: number, end: number] => {
    if (!series.length) return [0, CLOCK_END]
    const [min, max] = series.reduce<[number, number]>((range, { data }) =>
        data.reduce<[number, number]>(([min, max], value) =>
            [Math.min(min, value[1]), Math.max(max, value[2])], range), [CLOCK_END, 0])
    const interval = 30 * MILL_PER_MINUTE
    return [Math.max(0, Math.floor(min / interval) * interval), Math.min(CLOCK_END, Math.ceil(max / interval) * interval)]
}

const DAY_FMT = dateFmt({ month: 'short', day: '2-digit' })
const collectChartData = ({ activities, days, merge }: BizData) => {
    const rows = days.map(day => ({
        date: DAY_FMT.format(day.toDate()),
        range: [day.toLabel().getTime(), day.next().toLabel().getTime()] as const,
    }))
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
        data: rows.flatMap(({ range: [from, to] }, yIndex) => list.flatMap<MyValue>(activity => {
            const start = Math.max(activity.start, from)
            const duration = Math.min(activity.start + activity.duration, to) - start
            if (!(duration > 0)) return []
            const clockStart = clockTimeOf(start)
            return [[yIndex, clockStart, clockStart + duration, duration]]
        })),
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
                    formatter: val => formatTime(val),
                    color: primaryTextColor,
                },
                splitLine: { show: false },
            },
            tooltip: {
                ...CONFINE_TOOLTIP_OPTION,
                position: 'top',
                borderWidth: 0,
                formatter: params => {
                    const param = Array.isArray(params) ? params[0] : params
                    if (!param) return ''
                    const { value, seriesName, color } = param
                    const [, start, , duration] = value as MyValue
                    const rangeStr = `${formatTime(start, true)} ~ ${formatDuration(duration)}`
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