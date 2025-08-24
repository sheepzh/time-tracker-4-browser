import { getSeriesPalette, tooltipDot } from '@app/util/echarts'
import { EchartsWrapper } from '@hooks/useEcharts'
import { getPrimaryTextColor } from '@pages/util/style'
import { groupBy, toMap } from '@util/array'
import { formatPeriodCommon, MILL_PER_DAY, MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND } from '@util/time'
import {
    type ComposeOption, type CustomSeriesOption, type CustomSeriesRenderItem,
    type DataZoomComponentOption, type GridComponentOption, type LegendComponentOption, type TooltipComponentOption
} from 'echarts'
import { graphic } from "echarts/core"
import type { Activity, MergeMethod } from './useMerge'

export type BizData = {
    activities: Activity[]
    merge: MergeMethod
    dates: string[]
}

type EcOption = ComposeOption<
    | CustomSeriesOption
    | GridComponentOption
    | TooltipComponentOption
    | LegendComponentOption
    | DataZoomComponentOption
>

type LegendInfo = {
    name: string
    displayName?: string
    color: string
}

type MyItem = {
    // host
    name: string
    value: [
        yIndex: number,
        // seconds
        start: number,
        // seconds
        end: number,
        duration: number,
    ]
}

const formatTimeLabel = (val: number) => {
    let minute = Math.floor(val / MILL_PER_MINUTE)
    const hour = Math.floor(minute / 60)
    minute -= hour * 60
    return `${hour.toFixed(0).padStart(2, '0')}:${minute.toFixed(0).padStart(2, '0')}`
}

const formatStart = (startMs: number): string => {
    let second = Math.floor(startMs / MILL_PER_SECOND)
    let minute = Math.floor(second / 60)
    second -= minute * 60
    const hour = Math.floor(minute / 60)
    minute -= hour * 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`
}

const formatDuration = (duration: number): string => {
    if (duration < MILL_PER_SECOND) {
        return `${duration}ms`
    } else if (duration < MILL_PER_SECOND * 10) {
        return `${(duration / MILL_PER_SECOND).toFixed(1)}s`
    } else {
        return formatPeriodCommon(duration)
    }
}

const LEGEND_WIDTH = 180

const collectLegends = (activities: Activity[]): LegendInfo[] => {
    const colors = getSeriesPalette()
    const colorLen = colors.length || 1

    const keyNameMap = toMap(activities, a => a.seriesKey, a => a.seriesName)
    let totalDuration = groupBy(activities, a => a.seriesKey, l => l.map(t => t.duration).reduce((a, b) => a + b, 0))
    return Object.entries(totalDuration)
        // sort by duration desc
        .sort((a, b) => b[1] - a[1])
        .map(([key], idx) => ({
            name: key,
            displayName: keyNameMap[key],
            color: colors[idx % colorLen],
        }))
}

const renderItem: CustomSeriesRenderItem = (params, api) => {
    const categoryIndex = api.value(0)
    const start = api.coord([api.value(1), categoryIndex])
    const end = api.coord([api.value(2), categoryIndex])

    const size = api.size?.([0, 1])
    const height = ((Array.isArray(size) ? size[1] : size) ?? 0) * 0.6

    const coordSys = params.coordSys as unknown as Cartesian2DCoordSys

    var rectShape = graphic.clipRectByRect({
        x: start[0],
        y: start[1] - height / 2,
        width: end[0] - start[0],
        height: height
    }, {
        x: coordSys.x,
        y: coordSys.y,
        width: coordSys.width,
        height: coordSys.height,
    })

    return rectShape && {
        type: 'rect',
        transition: ['shape', 'style'],
        shape: rectShape,
        style: {
            fill: api.visual('color'),
        },
        focus: 'series',
    }
}

const generateSeries = (biz: BizData, legendColors: Record<string, string>): EcOption['series'] => {
    const { activities, dates, merge } = biz
    const groupBySeries = groupBy(activities, a => a.seriesKey, l => l)

    return Object.entries(groupBySeries).map(([series, list]) => {
        const color = legendColors[series]
        return {
            name: series,
            type: 'custom',
            id: `${merge}-${series}`,
            itemStyle: { color },
            encode: {
                x: [1, 2],
                y: 0,
            },
            renderItem,
            selectedMode: true,
            data: list.map(({ date, start, duration }) => ({
                value: [dates.indexOf(date), start, start + duration, duration],
            }))
        }
    })
}

class Wrapper extends EchartsWrapper<BizData, EcOption> {
    protected replaceSeries: boolean = true

    protected async generateOption(bizData: BizData): Promise<EcOption> {
        const { dates, activities, merge } = bizData
        const domWidth = this.getDomWidth()
        const gridLeft = Math.min(Math.max(30, domWidth * .05), 60)
        const primaryTextColor = getPrimaryTextColor()

        const legendData = collectLegends(activities)
        const legendNames = toMap(legendData, e => e.name, e => e.displayName)
        const legendColor = toMap(legendData, e => e.name, e => e.color)

        const tooltipSeriesName = (key: string) => {
            const name = legendNames[key]
            if (merge === 'cate') return name ?? key
            return name ? `${name} (${key})` : key
        }

        return {
            grid: {
                left: gridLeft, width: domWidth - gridLeft - LEGEND_WIDTH,
                bottom: '35%', height: '60%',
            },
            dataZoom: {
                type: 'slider',
                borderColor: 'transparent',
                bottom: 5,
                height: 20,
                labelFormatter: '',
                handleStyle: { opacity: 0 },
            },
            yAxis: {
                type: 'category',
                data: dates,
                axisTick: {
                    show: false,
                },
                axisLine: { show: false, },
                axisLabel: { color: primaryTextColor }
            },
            xAxis: {
                type: 'value',
                offset: 0,
                max: MILL_PER_DAY,
                minInterval: 10 * MILL_PER_MINUTE,
                interval: 4 * MILL_PER_HOUR,
                axisLabel: {
                    formatter: formatTimeLabel,
                    color: primaryTextColor,
                },
                splitLine: { show: false },
            },
            tooltip: {
                position: 'top',
                borderWidth: 0,
                formatter: params => {
                    const color = (params as any)?.color ?? "#000"
                    const param = Array.isArray(params) ? params[0] : params
                    const { value, seriesName } = param
                    const [_1, start, _2, duration] = value as MyItem['value']
                    const startStr = formatStart(start)
                    const durStr = formatDuration(duration)
                    return `${tooltipDot(color)} ${seriesName ? tooltipSeriesName(seriesName) : ''}`
                        + `<br/>${startStr} ~ ${durStr}`
                },
            },
            series: generateSeries(bizData, legendColor),
            legend: {
                type: 'scroll',
                orient: 'vertical',
                align: 'left',
                top: '6%',
                right: 0,
                textStyle: {
                    width: 120,
                    color: primaryTextColor,
                    overflow: 'truncate',
                },
                itemWidth: 20,
                data: legendData.map(({ name, color }) => ({
                    name,
                    itemStyle: { color },
                })),
                formatter: name => legendNames[name] ?? name,
            }
        }
    }
}

export default Wrapper