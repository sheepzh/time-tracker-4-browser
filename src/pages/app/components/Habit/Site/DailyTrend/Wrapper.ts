
import { t } from '@app/locale'
import { getLineSeriesPalette, tooltipDot, tooltipFlexLine, tooltipSpaceLine } from "@app/util/echarts"
import { cvt2LocaleTime, periodFormatter } from "@app/util/time"
import { EchartsWrapper } from '@hooks'
import { groupBy, sum } from "@util/array"
import { getHost } from "@util/stat"
import { getAllDatesBetween } from "@util/time"
import type {
    ComposeOption, GridComponentOption, LegendComponentOption, LineSeriesOption, LinearGradientObject,
    TitleComponentOption, TooltipComponentOption,
} from "echarts"
import type { TopLevelFormatterParams, YAXisOption } from "echarts/types/dist/shared"
import { generateTitleOption } from "../common"

type EcOption = ComposeOption<
    | GridComponentOption
    | TooltipComponentOption
    | TitleComponentOption
    | LineSeriesOption
    | LegendComponentOption
>

const [FOCUS_COLORS, VISIT_COLORS, COUNT_COLORS] = getLineSeriesPalette()
const FOCUS_LEGEND = t(msg => msg.item.focus)
const VISIT_LEGEND = t(msg => msg.item.time)
const COUNT_LEGEND = t(msg => msg.habit.site.trend.siteCount)
const LEGEND_COLOR_MAP = {
    [FOCUS_LEGEND]: FOCUS_COLORS,
    [VISIT_LEGEND]: VISIT_COLORS,
    [COUNT_LEGEND]: COUNT_COLORS,
}

const TITLE = t(msg => msg.habit.site.trend.title)

export type BizOption = {
    rows: timer.stat.Row[]
    dateRange: [Date, Date]
    timeFormat: timer.app.TimeFormat
}

const valueYAxis = (): YAXisOption => ({
    type: 'value',
    axisLabel: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
})

const formatTimeTooltip = (params: TopLevelFormatterParams, format: timer.app.TimeFormat) => {
    if (!Array.isArray(params)) return ''
    const date = params?.[0]?.name
    if (!date) return ''
    const dateLine = tooltipFlexLine(
        cvt2LocaleTime(date),
        TITLE,
    )
    const valueLines = params?.reverse?.()?.map(param => {
        const { value, seriesName = '' } = param
        const color = LEGEND_COLOR_MAP[seriesName]
        if (!color) return ''
        let valueStr: string | number = seriesName === FOCUS_LEGEND
            ? periodFormatter(value as number, { format })
            : (value as number)
        return tooltipFlexLine(
            `<b>${tooltipDot(color?.colorStops?.[0]?.color ?? '#000')}&ensp;${valueStr}</b>`,
            seriesName,
        )
    }).join('')

    return `${dateLine}${tooltipSpaceLine()}${valueLines}`
}

const lineOptionOf = (
    areaColor: LinearGradientObject,
    baseOption: RequiredPick<LineSeriesOption, 'data' | 'name' | 'yAxisIndex'>,
): LineSeriesOption => {
    return {
        type: 'line',
        areaStyle: { color: areaColor },
        showSymbol: false,
        lineStyle: { width: 0 },
        emphasis: { focus: "self" },
        ...baseOption,
    }
}

const legendOptionOf = (color: LinearGradientObject, name: string): Exclude<LegendComponentOption['data'], undefined>[number] => {
    return { name, itemStyle: { color } }
}

function generateOption(bizOption: BizOption): EcOption {
    const { dateRange, rows, timeFormat } = bizOption

    const [start, end] = dateRange
    const allDates = getAllDatesBetween(start, end)
    const focusMap = groupBy(rows, r => r.date, l => sum(l.map(e => e.focus)))
    const visitMap = groupBy(rows, r => r.date, l => sum(l.map(e => e.time)))
    const siteMap = groupBy(rows, r => r.date, l => new Set(l.map(e => getHost(e))).size)
    const countData = allDates.map(date => ({ date, value: siteMap[date] ?? 0 }))
    const visitData = allDates.map(date => ({ date, value: visitMap[date] ?? 0 }))
    const focusData = allDates.map(date => ({ date, value: focusMap[date] ?? 0 }))

    return {
        title: generateTitleOption(TITLE),
        grid: {
            bottom: '2%',
            top: '26%',
            right: 0,
            left: 20,
        },
        series: [
            lineOptionOf(COUNT_COLORS, {
                name: COUNT_LEGEND,
                data: countData,
                yAxisIndex: 0
            }),
            lineOptionOf(VISIT_COLORS, {
                name: VISIT_LEGEND,
                data: visitData,
                yAxisIndex: 1
            }),
            lineOptionOf(FOCUS_COLORS, {
                name: FOCUS_LEGEND,
                data: focusData,
                yAxisIndex: 2
            }),
        ],
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: "line" },
            formatter: (params: TopLevelFormatterParams) => formatTimeTooltip(params, timeFormat),
        },
        xAxis: {
            type: 'category',
            data: allDates,
            axisLabel: { show: false },
            axisTick: { show: false },
            axisLine: { show: false },
        },
        yAxis: [
            valueYAxis(),
            valueYAxis(),
            valueYAxis(),
        ],
        legend: {
            right: '2%',
            top: '16%',
            icon: 'roundRect',
            itemWidth: 20,
            itemGap: 5,
            textStyle: {
                // Hide text
                fontSize: 0,
            },
            tooltip: {
                show: true,
                formatter: (params: any) => (params?.name as string),
            },
            data: [
                legendOptionOf(FOCUS_COLORS, FOCUS_LEGEND),
                legendOptionOf(VISIT_COLORS, VISIT_LEGEND),
                legendOptionOf(COUNT_COLORS, COUNT_LEGEND),
            ]
        },
    }
}

export default class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    generateOption = generateOption

    protected rewrite(): boolean {
        return true
    }
}
