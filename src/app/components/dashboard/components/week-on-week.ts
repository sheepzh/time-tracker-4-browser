/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import type { Ref } from "vue"
import type { FillFlagParam, TimerQueryParam } from "@service/timer-service"
import type { ECharts, ComposeOption } from "echarts/core"
import type { CandlestickSeriesOption } from "echarts/charts"
import type { GridComponentOption, TitleComponentOption, TooltipComponentOption } from "echarts/components"

import { init, use } from "@echarts/core"
import CandlestickChart from "@echarts/chart/candlestick"
import GridComponent from "@echarts/component/grid"
import TitleComponent from "@echarts/component/title"
import TooltipComponent from "@echarts/component/tooltip"

use([CandlestickChart, GridComponent, TitleComponent, TooltipComponent])

import { formatPeriodCommon, MILL_PER_DAY } from "@util/time"
import { ElLoading } from "element-plus"
import { defineComponent, h, onMounted, ref } from "vue"
import timerService from "@service/timer-service"
import { groupBy, sum } from "@util/array"
import { BASE_TITLE_OPTION } from "../common"
import { t } from "@app/locale"
import { getPrimaryTextColor } from "@util/style"
import { generateSiteLabel } from "@util/site"

type EcOption = ComposeOption<
    | CandlestickSeriesOption
    | GridComponentOption
    | TitleComponentOption
    | TooltipComponentOption
>

const PERIOD_WIDTH = 7

const TOP_NUM = 5

const CONTAINER_ID = '__timer_dashboard_week_on_week'

type _Value = {
    lastPeriod: number
    thisPeriod: number
    delta: number
    host: string
}

function optionOf(lastPeriodItems: timer.stat.Row[], thisPeriodItems: timer.stat.Row[]): EcOption {
    const textColor = getPrimaryTextColor()

    const hostAliasMap: { [host: string]: string } = {
        ...groupBy(lastPeriodItems, item => item.host, grouped => grouped?.[0]?.alias),
        ...groupBy(thisPeriodItems, item => item.host, grouped => grouped?.[0]?.alias)
    }

    const lastPeriodMap: { [host: string]: number } = groupBy(lastPeriodItems,
        item => item.host,
        grouped => Math.floor(sum(grouped.map(item => item.focus)) / 1000)
    )

    const thisPeriodMap: { [host: string]: number } = groupBy(thisPeriodItems,
        item => item.host,
        grouped => Math.floor(sum(grouped.map(item => item.focus)) / 1000)
    )
    const values: { [host: string]: _Value } = {}
    // 1st, iterate this period
    Object.entries(thisPeriodMap)
        .forEach(([host, thisPeriod]) => {
            const lastPeriod = lastPeriodMap[host] || 0
            const delta = thisPeriod - lastPeriod
            values[host] = { thisPeriod, lastPeriod, delta, host }
        })
    // 2nd, iterate last period
    Object.entries(lastPeriodMap)
        .filter(([host]) => !values[host])
        .forEach(([host, lastPeriod]) => {
            const thisPeriod = thisPeriodMap[host] || 0
            const delta = thisPeriod - lastPeriod
            values[host] = { thisPeriod, lastPeriod, delta, host }
        })
    // 3rd, sort by delta
    const sortedValues = Object.values(values)
        .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))
        .reverse()
    const topK = sortedValues.slice(0, TOP_NUM)
    // 4th, sort by max value
    topK.sort((a, b) => Math.max(a.lastPeriod, a.thisPeriod) - Math.max(b.lastPeriod, b.thisPeriod))

    const positiveColor = getComputedStyle(document.body).getPropertyValue('--el-color-danger')
    const negativeColor = getComputedStyle(document.body).getPropertyValue('--timer-dashboard-heatmap-color-c')
    return {
        title: {
            ...BASE_TITLE_OPTION,
            text: t(msg => msg.dashboard.weekOnWeek.title, { k: TOP_NUM }),
            textStyle: {
                color: textColor,
                fontSize: '14px',
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter(params: any) {
                const data = params?.[0]?.data
                const host = params?.[0]?.axisValue
                const lastPeriod = data[1] || 0
                const thisPeriod = data[2] || 0
                const lastLabel = t(msg => msg.dashboard.weekOnWeek.lastBrowse, { time: formatPeriodCommon(lastPeriod * 1000) })
                const thisLabel = t(msg => msg.dashboard.weekOnWeek.thisBrowse, { time: formatPeriodCommon(thisPeriod * 1000) })
                const deltaLabel = t(msg => msg.dashboard.weekOnWeek.wow, {
                    delta: formatPeriodCommon(Math.abs(thisPeriod - lastPeriod) * 1000),
                    state: t(msg => msg.dashboard.weekOnWeek[thisPeriod < lastPeriod ? 'decline' : 'increase'])
                })
                const siteLabel = generateSiteLabel(host, hostAliasMap[host])
                return `${siteLabel}<br/>${lastLabel}<br/>${thisLabel}<br/>${deltaLabel}`
            }
        },
        grid: {
            left: '7%',
            right: '3%',
            bottom: '12%',
        },
        xAxis: {
            type: 'category',
            splitLine: { show: false },
            data: topK.map(a => a.host),
            axisLabel: {
                interval: 0,
                color: textColor,
                formatter: (host: string) => hostAliasMap[host] || host
            },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: textColor,
            }
        },
        series: [{
            type: 'candlestick',
            barMaxWidth: '40px',
            itemStyle: {
                color: positiveColor,
                borderColor: positiveColor,
                borderColor0: negativeColor,
                color0: negativeColor,
            },
            data: topK.map(a => [a.lastPeriod, a.thisPeriod, a.lastPeriod, a.thisPeriod])
        }]
    }
}

class ChartWrapper {
    instance: ECharts

    init(container: HTMLDivElement) {
        this.instance = init(container)
    }

    render(option: EcOption, loading: { close: () => void }) {
        this.instance.setOption(option)
        loading.close()
    }
}

const _default = defineComponent({
    name: "WeekOnWeek",
    setup() {
        const now = new Date()
        const lastPeriodStart = new Date(now.getTime() - MILL_PER_DAY * PERIOD_WIDTH * 2)
        const lastPeriodEnd = new Date(lastPeriodStart.getTime() + MILL_PER_DAY * (PERIOD_WIDTH - 1))
        const thisPeriodStart = new Date(now.getTime() - MILL_PER_DAY * PERIOD_WIDTH)
        // Not includes today
        const thisPeriodEnd = new Date(now.getTime() - MILL_PER_DAY)

        const chartWrapper: ChartWrapper = new ChartWrapper()
        const chart: Ref<HTMLDivElement> = ref()
        onMounted(async () => {
            const loading = ElLoading.service({
                target: `#${CONTAINER_ID}`,
            })
            chartWrapper.init(chart.value)
            const query: TimerQueryParam = {
                date: [lastPeriodStart, lastPeriodEnd],
                mergeDate: true,
            }
            // Query with alias 
            // @since 1.1.8
            const flagParam: FillFlagParam = { alias: true }
            const lastPeriodItems: timer.stat.Row[] = await timerService.select(query, flagParam)
            query.date = [thisPeriodStart, thisPeriodEnd]
            const thisPeriodItems: timer.stat.Row[] = await timerService.select(query, flagParam)
            const option = optionOf(lastPeriodItems, thisPeriodItems)
            chartWrapper.render(option, loading)
        })
        return () => h('div', {
            id: CONTAINER_ID,
            class: 'chart-container',
            ref: chart,
        })
    }
})

export default _default