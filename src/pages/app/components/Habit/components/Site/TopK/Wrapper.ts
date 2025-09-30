/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { getStepColors } from "@app/util/echarts"
import { periodFormatter } from "@app/util/time"
import { EchartsWrapper } from "@hooks/useEcharts"
import { generateSiteLabel } from "@util/site"
import { identifyTargetKey, isSite } from "@util/stat"
import {
    type BarSeriesOption,
    type ComposeOption,
    type GridComponentOption,
    type TitleComponentOption,
    type TooltipComponentOption,
} from "echarts"
import { type TopLevelFormatterParams } from "echarts/types/dist/shared"
import { type SeriesDataItem, generateTitleOption } from "../common"

type EcOption = ComposeOption<
    | BarSeriesOption
    | GridComponentOption
    | TooltipComponentOption
    | TitleComponentOption
>

type BizOption = {
    rows: timer.stat.Row[]
    timeFormat: timer.app.TimeFormat
}

const TOP_NUM = 8

const MARGIN_LEFT_P = 8
const MARGIN_RIGHT_P = 8

const formatFocusTooltip = (params: TopLevelFormatterParams, format: timer.app.TimeFormat): string => {
    const param = Array.isArray(params) ? params[0] : params
    const { data } = param || {}
    const row = (data as any)?.row as timer.stat.Row

    if (!isSite(row)) return ''

    const { siteKey: { host }, alias, focus = 0 } = row
    const siteLabel = host ? generateSiteLabel(host, alias) : (alias || 'Unknown')
    return `
        <div>${siteLabel}</div>
        <div>
            <b>${periodFormatter(focus, { format })}</b>
        </div>
    `
}

function mergeDate(origin: timer.stat.Row[]): timer.stat.Row[] {
    const map: Record<
        string,
        | MakeRequired<timer.stat.SiteRow | timer.stat.CateRow, 'mergedDates' | 'mergedRows'>
        | MakeRequired<timer.stat.GroupRow, 'mergedDates'>
    > = {}
    origin.forEach(ele => {
        const { date = '', focus, time } = ele
        const key = identifyTargetKey(ele)
        let exist = map[key]
        if (!exist) {
            exist = map[key] = {
                ...ele,
                focus: 0,
                time: 0,
                mergedRows: [],
                mergedDates: [],
                composition: { focus: [], time: [], run: [] },
            }
        }
        exist.focus += focus ?? 0
        exist.time += time ?? 0
        exist.mergedDates.push(date)
    })
    const newRows = Object.values(map)
    return newRows
}

async function generateOption(rows: timer.stat.Row[] = [], timeFormat: timer.app.TimeFormat, dom: HTMLElement): Promise<EcOption> {
    const merged = mergeDate(rows)
    const topList = merged.sort((a, b) => b.focus - a.focus).splice(0, TOP_NUM).reverse()
    const max = topList[topList.length - 1]?.focus ?? 0
    const hosts = topList.map(r => isSite(r) ? r.alias ?? r.siteKey.host : '').filter(s => !!s)

    const domW = dom.getBoundingClientRect().width
    const chartW = domW * (100 - MARGIN_LEFT_P - MARGIN_RIGHT_P) / 100

    const title = t(msg => msg.habit.site.histogramTitle, { n: TOP_NUM })

    return {
        title: generateTitleOption(title),
        grid: {
            left: `${MARGIN_LEFT_P}%`,
            right: `${MARGIN_RIGHT_P}%`,
            top: "16%",
            bottom: '4%',
        },
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (params: TopLevelFormatterParams) => formatFocusTooltip(params, timeFormat),
        },
        xAxis: {
            type: "value",
            minInterval: 1,
            axisLabel: { show: false },
            splitLine: { show: false },
            min: 0,
            max: max,
        },
        yAxis: {
            type: "category",
            data: hosts,
            axisLabel: {
                show: false,
            },
            axisTick: {
                show: false,
            },
            axisLine: {
                show: false,
            },
        },
        series: {
            type: "bar",
            barWidth: '100%',
            data: topList.map((row, idx) => {
                const isBottom = idx === 0
                const isTop = idx === topList.length - 1
                const { focus: value = 0 } = row || {}
                const labelW = (value / max) * chartW - 8
                return {
                    value, row,
                    label: { show: labelW >= 50, width: labelW },
                    itemStyle: {
                        borderRadius: [
                            isTop ? 5 : 0, isTop ? 5 : 0, 5, isBottom ? 5 : 0
                        ]
                    }
                }
            }),
            label: {
                position: 'insideRight',
                overflow: "truncate",
                ellipsis: '...',
                minMargin: 5,
                padding: [0, 4, 0, 0],
                formatter: (params: TopLevelFormatterParams) => {
                    const param = Array.isArray(params) ? params[0] : params
                    const { row } = (param.data || {}) as SeriesDataItem
                    if (!isSite(row)) return ''
                    const { siteKey, alias } = row
                    return alias ?? siteKey.host
                },
            },
            colorBy: 'data',
            color: getStepColors(topList.length, 1.5),
        },
    }
}

export default class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    generateOption = ({ rows, timeFormat }: BizOption) => generateOption(rows, timeFormat, this.getDom())
}
