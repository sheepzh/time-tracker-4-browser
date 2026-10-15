/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isDimensionEntry, type Circle, type DimensionData, type DimensionEntry } from '@app/components/Analysis/types'
import { formatValue } from '@app/components/Analysis/util'
import type { ValueFormatter } from '@app/components/common/kanban/types'
import { getLineSeriesPalette, tooltipDot, tooltipFlexLine } from '@app/util/echarts'
import { EchartsWrapper } from '@hooks'
import { getRegularTextColor } from '@pages/util/style'
import { cvt2LocaleDate } from '@pages/util/time'
import type { BarSeriesOption, ComposeOption, GridComponentOption, LineSeriesOption, TitleComponentOption, TooltipComponentOption } from 'echarts'
import type { CallbackDataParams } from "echarts/types/dist/shared"
import type { LineDataItemOption } from 'echarts/types/src/chart/line/LineSeries.js'
import type { OptionDataValue } from 'echarts/types/src/util/types.js'
import { createObjectGuard, isNumber } from 'typescript-guard'

type EcOption = ComposeOption<
    | BarSeriesOption
    | LineSeriesOption
    | TitleComponentOption
    | TooltipComponentOption
    | GridComponentOption
>

export type BizOption = {
    dimension?: DimensionData
    title: string
    valueFormatter: ValueFormatter
    circle: Circle
}

type ItemExt = {
    value: number
    _data: DimensionEntry
}
const isExt = createObjectGuard<ItemExt>({ value: isNumber, _data: isDimensionEntry })

type ValueItem = (OptionDataValue | OptionDataValue[] | LineDataItemOption) & ItemExt

const [THIS_COLOR, PREV_COLOR] = getLineSeriesPalette()

const createTooltipLine = ({ data, color }: CallbackDataParams, valueFormatter: ValueFormatter): string => {
    if (!isExt(data)) return ''
    const { _data: { date, endDate }, value } = data
    return tooltipFlexLine(
        `${tooltipDot(color)}&ensp;${cvt2LocaleDate(date, endDate)}`,
        `<b>${formatValue(value, valueFormatter)}</b>`
    )
}

const generateOption = ({ dimension, title, valueFormatter, circle }: BizOption) => {
    const isWeekly = circle === 'weekly'
    const { curr = [], prev = [] } = dimension ?? {}
    const thisExistData = curr.some(e => !!e.value)
    const prevExistData = prev.some(e => !!e.value)
    const thisPeriod: ValueItem[] = curr.map(r => ({ name: r.date, value: r.value, _data: r }))
    const prevPeriod: ValueItem[] = prev.map(r => ({ name: r.date, value: r.value, _data: r }))

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
            axisPointer: { type: isWeekly ? "shadow" : "line" },
            formatter(params) {
                if (!Array.isArray(params)) return ''
                return params.map(param => createTooltipLine(param, valueFormatter)).join('')
            },
        },
        xAxis: {
            type: 'category',
            data: curr.map((_, idx) => ({ value: idx, textStyle: { width: 0, opacity: 0 } })),
            show: false,
        },
        yAxis: {
            type: 'value',
            axisLabel: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
        },
        series: isWeekly ? {
            data: thisPeriod,
            type: 'bar',
            color: THIS_COLOR,
            barMaxWidth: 40,
            emphasis: { focus: 'series' },
        } : [{
            data: prevPeriod,
            type: 'line',
            showSymbol: false,
            smooth: true,
            lineStyle: { width: prevExistData ? 0 : 1 },
            color: PREV_COLOR.colorStops?.[0]?.color,
            areaStyle: { opacity: .5, color: PREV_COLOR },
            emphasis: { focus: "self" },
        }, {
            data: thisPeriod,
            type: 'line',
            showSymbol: false,
            smooth: true,
            lineStyle: { width: thisExistData ? 0 : 1 },
            color: THIS_COLOR.colorStops[0]?.color,
            areaStyle: { color: THIS_COLOR },
            emphasis: { focus: "series" },
        }]
    }
    return option
}

export default class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    protected override replaceSeries = true

    generateOption = generateOption
}
