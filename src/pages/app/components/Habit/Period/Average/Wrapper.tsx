/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { getCompareColor, tooltipDot, tooltipFlexLine, tooltipSpaceLine } from "@app/util/echarts"
import { EchartsWrapper } from "@hooks"
import { getPrimaryTextColor } from '@pages/util/style'
import { averageByDay, MINUTE_PER_PERIOD } from "@util/period"
import { formatPeriodCommon, MILL_PER_MINUTE } from "@util/time"
import type { BarSeriesOption, ComposeOption, GridComponentOption, TooltipComponentOption } from "echarts"
import { type TopLevelFormatterParams } from "echarts/types/dist/shared"
import { generateGridOption } from "../common"

type EcOption = ComposeOption<
    | BarSeriesOption
    | GridComponentOption
    | TooltipComponentOption
>

export type BizOption = {
    currRange: timer.period.KeyRange
    prevRange: timer.period.KeyRange
    curr: timer.period.Row[]
    prev: timer.period.Row[]
    periodSize: number
}

const [CURR_COLOR = '', PREV_COLOR = ''] = getCompareColor()

const cvt2Item = (row: timer.period.Row): number => {
    const milliseconds = row.milliseconds
    return milliseconds
}

const formatXAxis = (idx: number, periodSize: number) => {
    let min = idx * periodSize * MINUTE_PER_PERIOD
    const hour = Math.floor(min / 60)
    min = min - hour * 60
    return hour.toString().padStart(2, '0') + ':' + min.toString().padStart(2, '0')
}

const key2Str = (key: timer.period.Key) => {
    const { month, date } = key
    return `${month?.toString?.()?.padStart(2, '0')}/${date?.toString?.()?.padStart(2, '0')}`
}

const isSameDay = (keyRange: timer.period.KeyRange): boolean => {
    const [start, end] = keyRange || []
    return start?.year === end?.year
        && start?.month === end?.month
        && start?.date === end?.date
}

const range2Str = (keyRange: timer.period.KeyRange) => {
    const [start, end] = keyRange
    return isSameDay(keyRange) ? key2Str(start) : `${key2Str(start)}-${key2Str(end)}`
}

const formatValueLine = (mill: number, range: timer.period.KeyRange, color: string): string => {
    return tooltipFlexLine(
        `${tooltipDot(color)}&ensp;<b>${formatPeriodCommon(mill ?? 0)}</b>`,
        range2Str(range),
    )
}

const formatTooltip = (params: TopLevelFormatterParams, biz: BizOption): string => {
    const { periodSize, prevRange, currRange } = biz
    if (!Array.isArray(params)) return ''
    const [curr, prev] = params ?? []

    const idx = curr?.dataIndex ?? 0
    const start = formatXAxis(idx, periodSize)
    const end = formatXAxis(idx + 1, periodSize)

    const periodStr = `${start}-${end}`
    const timeLine = isSameDay(currRange)
        ? periodStr
        : tooltipFlexLine(
            t(msg => msg.habit.period.chartType.average),
            periodStr,
        )

    const currLine = formatValueLine(curr?.value as number ?? 0, currRange, CURR_COLOR)
    const prevLine = formatValueLine(-(prev?.value ?? 0 as number), prevRange, PREV_COLOR)

    return `${timeLine}${tooltipSpaceLine()}${currLine}${prevLine}`
}

const generateOption = (biz: BizOption): EcOption => {
    let { curr, prev, periodSize } = biz

    curr = averageByDay(curr, periodSize)
    prev = averageByDay(prev, periodSize)

    const currData = curr.map(r => cvt2Item(r))
    const prevData = prev.map(r => cvt2Item(({ ...r, milliseconds: -r.milliseconds })))

    const textColor = getPrimaryTextColor()
    const borderRadius = 5 * periodSize

    return {
        tooltip: {
            trigger: 'axis',
            formatter: (params: TopLevelFormatterParams) => formatTooltip(params, biz),
        },
        grid: generateGridOption(),
        xAxis: {
            type: 'category',
            axisLabel: {
                color: textColor,
                interval: (16 / periodSize - 1),
                formatter: (_, index) => formatXAxis(index, periodSize),
            },
            axisLine: { show: false },
            axisTick: { show: false },
            min: 0,
            max: currData.length,
            offset: -borderRadius * 2,
        },
        yAxis: {
            type: 'value',
            axisLabel: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            max: Math.max(...currData) + MILL_PER_MINUTE,
            min: Math.min(...prevData) - MILL_PER_MINUTE,
        },
        series: [
            {
                type: "bar",
                stack: 'one',
                large: true,
                data: currData.map((value, idx) => ({
                    value,
                    itemStyle: { borderRadius: prevData[idx] ? [borderRadius, borderRadius, 0, 0] : borderRadius },
                })),
                barCategoryGap: '50%',
                color: CURR_COLOR,
            }, {
                type: "bar",
                stack: 'one',
                large: true,
                data: prevData.map((value, idx) => ({
                    value,
                    itemStyle: { borderRadius: currData[idx] ? [0, 0, borderRadius, borderRadius] : borderRadius },
                })),
                color: PREV_COLOR,
            }
        ],
    }
}

export default class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    generateOption = generateOption
}