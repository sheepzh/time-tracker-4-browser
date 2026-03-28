import { getLineSeriesPalette } from "@app/util/echarts"
import { EchartsWrapper } from "@hooks"
import { t } from '@app/locale'
import { periodFormatter } from '@app/util/time'
import { formatTime } from "@util/time"
import type { ComposeOption, GridComponentOption, LineSeriesOption, TooltipComponentOption } from "echarts"
import { type TopLevelFormatterParams } from "echarts/types/dist/shared"
import { formatXAxisTime, generateGridOption } from "../common"

type EcOption = ComposeOption<
    | LineSeriesOption
    | TooltipComponentOption
    | GridComponentOption
>

export type BizOption = {
    data: timer.period.Row[]
    timeFormat: timer.app.TimeFormat
}

const [COLOR] = getLineSeriesPalette()

const formatTooltip = (params: TopLevelFormatterParams, timeFormat: timer.app.TimeFormat) => {
    const param = Array.isArray(params) ? params[0] : params
    const [, total, , end] = param.data as number[]
    return `
        <div>${formatTime(end, t(msg => msg.calendar.timeFormat))}</div>
        <div><b>${periodFormatter(total, { format: timeFormat })}</b></div>
    `
}

const generateOption = (biz: BizOption): EcOption => {
    const { data, timeFormat } = biz || {}
    let stackVal: number = 0
    const seriesData = data.map(row => {
        const startTime = row.startTime
        const endTime = row.endTime
        const time = (startTime + endTime) / 2
        const delta = row.milliseconds ?? 0
        stackVal += delta
        return [time, stackVal, startTime, endTime, delta]
    })

    return {
        grid: generateGridOption(),
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: "line" },
            formatter: params => formatTooltip(params, timeFormat),
        },
        xAxis: {
            type: 'time',
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: { formatter: formatXAxisTime }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { show: false },
            splitLine: { show: false },
        },
        series: {
            type: 'line',
            data: seriesData,
            areaStyle: { color: COLOR },
            showSymbol: false,
            lineStyle: { width: 0 },
        }
    }
}

export default class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    generateOption = generateOption
}