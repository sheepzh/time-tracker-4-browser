/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { periodFormatter } from "@app/util/time"
import { EchartsWrapper } from "@hooks/useEcharts"
import { getRegularTextColor, getSecondaryTextColor } from "@pages/util/style"
import weekHelper from "@service/components/week-helper"
import { groupBy, rotate, toMap } from "@util/array"
import { formatTime, getAllDatesBetween, MILL_PER_WEEK, parseTime } from "@util/time"
import type {
    ComposeOption,
    EffectScatterSeriesOption,
    GridComponentOption,
    TitleComponentOption,
    TooltipComponentOption,
    VisualMapComponentOption
} from "echarts"
import type { TopLevelFormatterParams } from "echarts/types/dist/shared"

type EcOption = ComposeOption<
    | EffectScatterSeriesOption
    | TitleComponentOption
    | TooltipComponentOption
    | GridComponentOption
    | VisualMapComponentOption
>

type _Value = [
    // X
    number,
    // Y
    number,
    // milliseconds
    number,
    // date yyyyMMdd
    string,
]

const MAX_WEEK_NUM = 26
const MIN_GRID_LEFT_PX = 50

const getWeekNum = (domWidth: number): number => {
    const weekNum = Math.floor(domWidth - MIN_GRID_LEFT_PX) / 27
    return Math.floor(Math.min(weekNum, MAX_WEEK_NUM))
}

type EffectScatterItem = MakeRequired<EffectScatterSeriesOption, 'data'>["data"][number]
const cvtHeatmapItem = (d: _Value): EffectScatterItem => {
    let item: EffectScatterItem = { value: d, itemStyle: undefined, label: undefined, emphasis: undefined }
    const minutes = d[2]
    if (!minutes) {
        item.itemStyle = { color: 'transparent' }
        item.emphasis = { disabled: true }
    }
    return item
}

function getXAxisLabelMap(data: _Value[]): { [x: string]: string } {
    const allMonthLabel = t(msg => msg.calendar.months).split('|')
    const result: Record<string, string> = {}
    // {[ x:string ]: Set<string> }
    const xAndMonthMap = groupBy(data, e => e[0], grouped => new Set(grouped.map(a => a[3].substring(4, 6))))
    let lastMonth: string | undefined = undefined
    Object.entries(xAndMonthMap).forEach(([x, monthSet]) => {
        if (monthSet.size != 1) {
            return
        }
        const currentMonth = Array.from(monthSet)[0]
        if (currentMonth === lastMonth) {
            return
        }
        lastMonth = currentMonth
        const monthNum = parseInt(currentMonth)
        const label = allMonthLabel[monthNum - 1]
        result[x] = label
    })
    return result
}

function optionOf(data: _Value[], weekDays: string[], format: timer.app.TimeFormat, domWidth: number): EcOption {
    const xAxisLabelMap = getXAxisLabelMap(data)
    const axisTextColor = getSecondaryTextColor()
    const gridLeft = domWidth * 0.1 < MIN_GRID_LEFT_PX ? MIN_GRID_LEFT_PX : '10%'
    return {
        title: {
            text: t(msg => msg.analysis.summary.calendarTitle),
            textStyle: {
                color: getRegularTextColor(),
                fontSize: '14px',
                fontWeight: 'normal',
            },
            left: 'center',
            top: '4%',
        },
        tooltip: {
            borderWidth: 0,
            formatter: (params: TopLevelFormatterParams) => {
                const parma = Array.isArray(params) ? params[0] : params
                const { data } = parma
                const { value } = data as any
                const [_1, _2, mills, date] = value as _Value
                if (!mills) return ''
                const time = parseTime(date)
                return time ? `${formatTime(time, t(msg => msg.calendar.dateFormat))}<br /><b>${periodFormatter(mills, { format })}</b>` : ''
            },
        },
        grid: { height: '68%', left: gridLeft, right: 0, top: '18%' },
        xAxis: {
            type: 'category',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                formatter: (x: string) => xAxisLabelMap[x] || '',
                interval: 0,
                color: axisTextColor,
            },
        },
        yAxis: {
            type: 'category',
            data: weekDays,
            axisLabel: { padding: /* T R B L */[0, 12, 0, 0], color: axisTextColor },
            axisLine: { show: false },
            axisTick: { show: false, alignWithLabel: true },
        },
        visualMap: {
            min: 0,
            max: Math.max(...data.map(a => a[2])),
            show: false,
            inRange: { color: ['rgb(55, 162, 255)', 'rgb(116, 21, 219)'] },
            dimension: 2,
        },
        series: {
            type: "effectScatter",
            data: data.map(cvtHeatmapItem),
            progressive: 5,
            progressiveThreshold: 10,
        },
    }
}

export type BizOption = {
    rows: timer.stat.Row[]
    timeFormat: timer.app.TimeFormat
}

class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    isSizeSensitize = true

    protected async generateOption({ rows = [], timeFormat }: BizOption): Promise<EcOption> {
        const width = this.getDomWidth()
        const colNum = getWeekNum(width)
        const endTime = new Date()
        const [startTime,] = await weekHelper.getWeekDate(endTime.getTime() - MILL_PER_WEEK * (colNum - 1))
        const allDates = getAllDatesBetween(startTime, endTime)
        const value = toMap(rows, r => r.date, r => r.focus)
        const data: _Value[] = []
        allDates.forEach((date, index) => {
            const dailyMills = value[date] || 0
            const colIndex = parseInt((index / 7).toString())
            const weekDay = index % 7
            const x = colIndex, y = 7 - (1 + weekDay)
            data.push([x, y, dailyMills, date])
        })
        const weekStart = await weekHelper.getRealWeekStart()
        const weekDays = (t(msg => msg.calendar.weekDays)?.split?.('|') || []).reverse()
        rotate(weekDays, weekStart, true)
        return optionOf(data, weekDays, timeFormat, width)
    }
}

export default Wrapper