/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { getStepColors, isCalendarValue, parseValueOfFormatter, type CalendarValue } from '@app/util/echarts'
import { cvt2LocaleTime, getWeekDays } from '@app/util/time'
import { EchartsWrapper } from "@hooks"
import { getPrimaryTextColor } from '@pages/util/style'
import { groupBy } from "@util/array"
import { formatPeriodCommon, getAllDatesBetween, MILL_PER_HOUR, MILL_PER_MINUTE } from "@util/time"
import type {
    ComposeOption, GridComponentOption, HeatmapSeriesOption, ScatterSeriesOption, TooltipComponentOption,
    VisualMapComponentOption,
} from "echarts"

type EcOption = ComposeOption<
    | ScatterSeriesOption
    | TooltipComponentOption
    | GridComponentOption
    | VisualMapComponentOption
>

export type BizOption = {
    startTime: Date
    endTime: Date
    value: { [date: string]: number }
}

function getXAxisLabelMap(data: CalendarValue[]): { [x: string]: string } {
    const allMonthLabel = t(msg => msg.calendar.months).split('|')
    const result: Record<string, string> = {}
    // {[ x:string ]: Set<string> }
    const xAndMonthMap = groupBy(data, e => e[0], grouped => new Set(grouped.map(a => a[3].substring(4, 6))))
    let lastMonth: string | undefined
    Object.entries(xAndMonthMap).forEach(([x, monthSet]) => {
        if (monthSet.size != 1) return
        const currentMonth = Array.from(monthSet)[0]
        if (!currentMonth || currentMonth === lastMonth) return
        lastMonth = currentMonth
        const monthNum = parseInt(currentMonth)
        const label = allMonthLabel[monthNum - 1]
        label && (result[x] = label)
    })
    return result
}

type HeatmapItem = Exclude<HeatmapSeriesOption["data"], undefined>[number]

const cvtHeatmapItem = (d: CalendarValue): HeatmapItem => {
    let item: HeatmapItem = { value: d, itemStyle: undefined, label: undefined, emphasis: undefined }
    const minutes = d[2]
    if (!minutes) {
        item.itemStyle = { color: 'transparent' }
        item.emphasis = { disabled: true }
    }
    return item
}

type Piece = {
    label: string
    min: number
    max: number
    color?: string
}

const minOf = (min: number) => min * MILL_PER_MINUTE
const hourOf = (hour: number) => hour * MILL_PER_HOUR

const ALL_PIECES: Piece[] = [
    { min: 1, max: minOf(10), label: "<10m" },
    { min: minOf(10), max: minOf(30), label: "<30m" },
    { min: minOf(30), max: hourOf(1), label: "<1h" },
    { min: hourOf(1), max: hourOf(2), label: "<2h" },
    { min: hourOf(2), max: hourOf(4), label: "<4h" },
    { min: hourOf(4), max: hourOf(7), label: "<7h" },
    { min: hourOf(7), max: hourOf(12), label: "<12h" },
    { min: hourOf(12), max: hourOf(18), label: "<18h" },
    { min: hourOf(18), max: hourOf(24), label: ">=18h" },
]

const computePieces = (min: number, max: number): Piece[] => {
    let pieces = ALL_PIECES.filter((p, i) => i === 0 || p.min <= max)
    pieces = pieces.filter((p, i) => p.max > min || i === pieces.length - 1)

    const colors = getStepColors(pieces.length)
    return pieces.map((p, idx) => ({ ...p, color: colors[idx] }))
}

function optionOf(data: CalendarValue[], weekDays: string[], dom: HTMLElement): EcOption {
    const xAxisLabelMap = getXAxisLabelMap(data)
    const textColor = getPrimaryTextColor()
    const w = dom?.getBoundingClientRect?.()?.width
    const gridWidth = 0.85
    const colCount = new Set(data.map(v => v[0])).size
    const gridCellSize = colCount ? w * gridWidth / colCount * 0.75 : 0

    const maxVal = Math.max(...data.map(a => a[2]))
    const minVal = Math.min(...data.map(a => a[2]).filter(v => v))
    return {
        tooltip: {
            borderWidth: 0,
            formatter: params => {
                const value = parseValueOfFormatter(params)
                if (!isCalendarValue(value) || !value[2]) return ''
                return `${cvt2LocaleTime(value[3])}<br /><b>${formatPeriodCommon(value[2])}</b>`
            },
        },
        grid: { height: '70%', left: '7%', width: `${gridWidth * 100}%`, top: '18%', },
        xAxis: {
            type: 'category',
            axisLine: { show: false },
            axisTick: { show: false, alignWithLabel: true },
            axisLabel: {
                formatter: x => xAxisLabelMap[x] ?? '',
                interval: 0,
                margin: 14,
                color: textColor,
            },
        },
        yAxis: {
            type: 'category',
            data: weekDays,
            axisLabel: { padding: /* T R B L */[0, 12, 0, 0], color: textColor },
            axisLine: { show: false },
            axisTick: { show: false, alignWithLabel: true },
        },
        visualMap: {
            type: 'piecewise',
            realtime: true,
            calculable: true,
            orient: 'vertical',
            right: '2%',
            top: 'center',
            dimension: 2,
            splitNumber: 6,
            showLabel: true,
            pieces: computePieces(minVal, maxVal),
            textStyle: { color: getPrimaryTextColor() },
        },
        series: {
            type: 'scatter',
            data: data.map(cvtHeatmapItem),
            symbol: 'circle',
            symbolSize: gridCellSize,
        },
    }
}

class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    protected override isSizeSensitize: boolean = true

    protected async generateOption(option: BizOption): Promise<EcOption> {
        if (!option) return {}

        const { startTime, endTime, value } = option
        const allDates = getAllDatesBetween(startTime, endTime)
        const data: CalendarValue[] = []
        allDates.forEach((date, index) => {
            const dailyMills = value[date] || 0
            const colIndex = parseInt((index / 7).toString())
            const weekDay = index % 7
            const x = colIndex, y = 7 - (1 + weekDay)
            data.push([x, y, dailyMills, date])
        })
        const weekDays = await getWeekDays()
        return optionOf(data, weekDays, this.getDom())
    }
}

export default Wrapper