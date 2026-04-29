/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { getSeriesPalette } from "@app/util/echarts"
import { periodFormatter } from '@app/util/time'
import { EchartsWrapper } from "@hooks"
import { getPrimaryTextColor } from '@pages/util/style'
import { formatTime } from "@util/time"
import type { BarSeriesOption, ComposeOption, GridComponentOption, TooltipComponentOption } from "echarts"
import type { TopLevelFormatterParams } from "echarts/types/dist/shared"
import { formatXAxisTime, generateGridOption } from "../common"

type EcOption = ComposeOption<
    | BarSeriesOption
    | GridComponentOption
    | TooltipComponentOption
>

export type BizOption = {
    data: timer.period.Row[]
    timeFormat: timer.app.TimeFormat
}


function formatTimeOfEcharts(params: TopLevelFormatterParams, timeFormat: timer.app.TimeFormat): string {
    const format = Array.isArray(params) ? params[0] : params
    if (!format) return 'NaN'
    const { value } = format
    if (!Array.isArray(value)) return 'NaN'
    const time = value?.[1] ?? 0
    const startTs = value?.[2]
    const endTs = value?.[3]
    const start = typeof startTs === 'number' ? formatTime(startTs, '{m}-{d} {h}:{i}') : 'NaN'
    const end = typeof endTs === 'number' ? formatTime(endTs, '{h}:{i}') : 'NaN'
    const milliseconds = time instanceof Date
        ? time.getTime()
        : (typeof time === 'number' ? time : Number.parseInt(time))
    return `
        <div>${start}-${end}</div>
        <div>
            <b>
                ${periodFormatter(milliseconds, { format: timeFormat })}
            </b>
        </div>
    `
}

type BarItem = Exclude<BarSeriesOption["data"], undefined>[number]

const cvt2Item = (row: timer.period.Row): BarItem => {
    const startTime = row.startTime
    const endTime = row.endTime
    const time = (startTime + endTime) / 2
    const milliseconds = row.milliseconds
    return [time, milliseconds, startTime, endTime]
}

function generateOption({ data, timeFormat }: BizOption): EcOption {
    const seriesData: BarItem[] = data.map(r => cvt2Item(r))
    const color = getSeriesPalette()?.[3]

    const textColor = getPrimaryTextColor()

    return {
        tooltip: {
            formatter: (params: TopLevelFormatterParams) => formatTimeOfEcharts(params, timeFormat),
            borderColor: undefined,
        },
        grid: generateGridOption(),
        xAxis: {
            type: 'time',
            axisLabel: { formatter: formatXAxisTime, color: textColor },
            axisLine: { show: false },
            axisTick: { show: false },
            min: (seriesData[0] as Exclude<BarItem, number | string | Date | any>)?.[0],
            max: (seriesData[seriesData.length - 1] as Exclude<BarItem, number | string | Date | any>)?.[0],
        },
        yAxis: {
            type: 'value',
            axisLabel: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
        },
        series: {
            type: "bar",
            large: true,
            data: seriesData,
            barCategoryGap: 0,
            itemStyle: { borderWidth: 0 },
            color,
        },
    }
}
export default class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    generateOption = generateOption
}