/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { DimensionEntry } from '@app/components/Analysis/types'
import type { ValueFormatter } from '@app/components/common/kanban/types'
import { EchartsWrapper } from '@hooks'
import { getLineSeriesPalette, tooltipDot, tooltipFlexLine } from '@app/util/echarts'
import { getRegularTextColor } from '@pages/util/style'
import type {
    ComposeOption, GridComponentOption, LineSeriesOption, TitleComponentOption, TooltipComponentOption,
} from "echarts"
import type { TopLevelFormatterParams } from "echarts/types/dist/shared"

type EcOption = ComposeOption<
    | LineSeriesOption
    | TitleComponentOption
    | TooltipComponentOption
    | GridComponentOption
>

type BizOption = {
    entries: DimensionEntry[]
    preEntries: DimensionEntry[]
    title: string
    valueFormatter: ValueFormatter
}

type ValueItem = Exclude<LineSeriesOption["data"], undefined>[0] & {
    _data: DimensionEntry
}

const [THIS_COLOR, PREV_COLOR] = getLineSeriesPalette()

const createTooltipLine = (param: any, valueFormatter: ValueFormatter): string => {
    const data = param.data as ValueItem
    const { _data: { value, date } } = data

    const valStr = valueFormatter?.(value) || value?.toString() || "NaN"

    return tooltipFlexLine(
        `${tooltipDot(param.color)}&ensp;${date}`,
        `<b>${valStr}</b>`
    )
}

const formatTooltip = (params: TopLevelFormatterParams, valueFormatter: ValueFormatter) => {
    if (!Array.isArray(params)) return ''

    const lines = params.map(param => createTooltipLine(param, valueFormatter))
    return lines.join('')
}

const generateOption = ({ entries, preEntries, title, valueFormatter }: BizOption) => {
    const thisExistData = entries?.some(e => !!e.value)
    const prevExistData = preEntries?.some(e => !!e.value)
    const thisPeriod: ValueItem[] = entries?.map(r => ({ name: r.date, value: r.value, _data: r }))
    const prevPeriod: ValueItem[] = preEntries?.map(r => ({ name: r.date, value: r.value, _data: r }))

    const option: EcOption = {
        backgroundColor: 'rgba(0,0,0,0)',
        title: {
            text: title,
            textStyle: {
                color: getRegularTextColor(),
                fontSize: '14px',
                fontWeight: 'normal',
            },
            left: 'center',
            top: '9%',
        },
        grid: {
            top: '30%',
            bottom: '10px',
            left: '5%',
            right: '5%',
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: "line" },
            formatter: (params: TopLevelFormatterParams) => formatTooltip(params, valueFormatter),
        },
        xAxis: {
            type: 'category',
            data: entries?.map((_, idx) => ({ value: idx, textStyle: { width: 0, opacity: 0 } })),
            show: false,
        },
        yAxis: {
            type: 'value',
            axisLabel: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
        },
        series: [{
            data: prevPeriod,
            type: 'line',
            showSymbol: false,
            smooth: true,
            lineStyle: { width: prevExistData ? 0 : 1 },
            color: PREV_COLOR.colorStops[0].color,
            areaStyle: { opacity: .5, color: PREV_COLOR },
            emphasis: { focus: "self" },
        }, {
            data: thisPeriod,
            type: 'line',
            showSymbol: false,
            smooth: true,
            lineStyle: { width: thisExistData ? 0 : 1 },
            color: THIS_COLOR.colorStops[0].color,
            areaStyle: { color: THIS_COLOR },
            emphasis: { focus: "series" },
        }]
    }
    return option
}

export default class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    generateOption = generateOption
}
