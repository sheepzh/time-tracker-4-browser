/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { getCompareColor, tooltipDot, tooltipFlexLine, tooltipSpaceLine } from "@app/util/echarts"
import { EchartsWrapper } from "@hooks"
import { getPrimaryTextColor, getSecondaryTextColor } from '@pages/util/style'
import { averageByDay, MINUTE_PER_PERIOD } from "@util/period"
import { formatPeriodCommon, MILL_PER_MINUTE } from "@util/time"
import type {
    BarSeriesOption, ComposeOption, EChartsType, ElementEvent, GridComponentOption, MarkLineComponentOption,
    TooltipComponentOption,
} from "echarts"
import type { TopLevelFormatterParams } from "echarts/types/dist/shared"
import { generateGridOption } from "../common"

type EcOption = ComposeOption<
    | BarSeriesOption
    | GridComponentOption
    | TooltipComponentOption
>

export type BizOption = {
    currRange: tt4b.period.KeyRange
    prevRange: tt4b.period.KeyRange
    curr: tt4b.period.Row[]
    prev: tt4b.period.Row[]
    periodSize: number
}

const [CURR_COLOR = '', PREV_COLOR = ''] = getCompareColor()

const cvt2Item = (row: tt4b.period.Row): number => {
    const milliseconds = row.milliseconds
    return milliseconds
}

const formatXAxis = (idx: number, periodSize: number) => {
    let min = idx * periodSize * MINUTE_PER_PERIOD
    const hour = Math.floor(min / 60)
    min = min - hour * 60
    return hour.toString().padStart(2, '0') + ':' + min.toString().padStart(2, '0')
}

const key2Str = (key: tt4b.period.Key) => {
    const { month, date } = key
    return `${month?.toString?.()?.padStart(2, '0')}/${date?.toString?.()?.padStart(2, '0')}`
}

const isSameDay = (keyRange: tt4b.period.KeyRange): boolean => {
    const [start, end] = keyRange || []
    return start?.year === end?.year
        && start?.month === end?.month
        && start?.date === end?.date
}

const range2Str = (keyRange: tt4b.period.KeyRange) => {
    const [start, end] = keyRange
    return isSameDay(keyRange) ? key2Str(start) : `${key2Str(start)}-${key2Str(end)}`
}

const formatValueLine = (mill: number, range: tt4b.period.KeyRange, color: string): string => {
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

const MARK_LINE_COLOR = getSecondaryTextColor()
const LABEL_COLOR = getPrimaryTextColor()

const generateOption = (biz: BizOption): EcOption => {
    let { curr, prev, periodSize } = biz

    curr = averageByDay(curr, periodSize)
    prev = averageByDay(prev, periodSize)

    const currData = curr.map(r => cvt2Item(r))
    const prevData = prev.map(r => cvt2Item(({ ...r, milliseconds: -r.milliseconds })))
    const borderRadius = 5 * periodSize

    return {
        tooltip: {
            trigger: 'axis',
            formatter: (params: TopLevelFormatterParams) => formatTooltip(params, biz),
            axisPointer: {
                lineStyle: { color: MARK_LINE_COLOR },
            }
        },
        grid: { ...generateGridOption(), right: 30 },
        xAxis: {
            type: 'category',
            axisLabel: {
                color: LABEL_COLOR,
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
                data: currData.map((value, idx) => ({
                    value,
                    itemStyle: { borderRadius: prevData[idx] ? [borderRadius, borderRadius, 0, 0] : borderRadius },
                })),
                barCategoryGap: '50%',
                color: CURR_COLOR,
            }, {
                type: "bar",
                stack: 'one',
                data: prevData.map((value, idx) => ({
                    value,
                    itemStyle: { borderRadius: currData[idx] ? [0, 0, borderRadius, borderRadius] : borderRadius },
                })),
                color: PREV_COLOR,
            }
        ],
    }
}

class Markline {
    #locked = false
    #lockedValue: number | null = null
    #currentYValue: number | null = null
    #rafId: number | null = null

    constructor(
        private chart: EChartsType,
        private getPeriodSize: () => number | undefined,
    ) {
    }

    get #segWidth(): number {
        const periodSize = this.getPeriodSize()
        if (!periodSize || periodSize <= 1) return MILL_PER_MINUTE * 1
        if (periodSize <= 4) return MILL_PER_MINUTE * 5
        return MILL_PER_MINUTE * 10
    }

    init() {
        this.chart.getZr().on('mousemove', params => this.#handleMouseMove(params))
        this.chart.getZr().on('click', params => this.#handleClick(params))
        this.chart.getZr().on('globalout', () => this.#handleGlobalout())
    }

    #handleClick(params: ElementEvent): boolean | void {
        const pointInPixel = [params.offsetX, params.offsetY]

        if (!this.chart.containPixel('grid', pointInPixel)) {
            // Click outside grid area, ignore
            return
        }

        if (this.#locked) {
            this.#unlock()
            return
        }

        if (this.#currentYValue !== null && !isNaN(this.#currentYValue)) {
            this.#locked = true
            this.#lockedValue = this.#currentYValue
            this.#render()
        }
    }

    #handleMouseMove(params: ElementEvent) {
        if (this.#rafId) return

        this.#rafId = requestAnimationFrame(() => {
            const pointInPixel = [params.offsetX, params.offsetY]

            if (this.chart.containPixel('grid', pointInPixel)) {
                // Move in the grid area: update current Y value
                const [, yVal] = this.chart.convertFromPixel({ seriesIndex: 0 }, pointInPixel)
                if (yVal !== undefined && !isNaN(yVal)) {
                    const segWidth = this.#segWidth
                    this.#currentYValue = Math.round(yVal / segWidth) * segWidth
                    !this.#locked && this.#render()
                }
            } else {
                this.#handleGlobalout()
            }
            this.#rafId = null
        })
    }

    #render() {
        const val = this.#locked ? this.#lockedValue : this.#currentYValue

        const markLine: MarkLineComponentOption = val === null || isNaN(val)
            ? { data: [] }
            : {
                animation: false,
                symbol: 'none',
                lineStyle: {
                    width: 1,
                    type: 'dashed',
                    opacity: .6,
                    color: MARK_LINE_COLOR,
                },
                label: {
                    show: true,
                    position: 'end',
                    formatter: `${(val / MILL_PER_MINUTE).toFixed(0)}m`,
                    fontSize: 11,
                    borderRadius: 3,
                    color: LABEL_COLOR,
                    opacity: 1,
                },
                data: [{ yAxis: val }],
                emphasis: {
                    lineStyle: {
                        width: 1,
                        type: 'dashed',
                        opacity: 1,
                        color: MARK_LINE_COLOR,
                    }
                }
            }

        this.chart.setOption(
            { series: [{ markLine }] },
            // Use layzUpdate to avoid triggering animation which may conflict with series data animations
            { notMerge: false, lazyUpdate: true },
        )
    }

    /**
     * Do nothing if locked, or clear the mark line
     */
    #handleGlobalout() {
        if (this.#locked) return
        this.#currentYValue = null
        this.#render()
    }

    #unlock() {
        this.#locked = false
        this.#lockedValue = null
        this.#render()
    }

    forceLock(ms: number) {
        const segWidth = this.#segWidth
        this.#locked = true
        this.#lockedValue = Math.round(ms / segWidth) * segWidth
        this.#render()
    }
}

export default class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    #markline: Markline | undefined

    generateOption = generateOption

    override init(container: HTMLDivElement): void {
        super.init(container)

        if (!this.instance) return

        this.#markline = new Markline(this.instance, () => this.lastBizOption?.periodSize)
        this.#markline.init()
    }

    override async render(biz: BizOption): Promise<void> {
        await super.render(biz)
        const { curr } = biz
        const len = curr.length
        if (!len) return
        const average = curr.reduce((sum, r) => sum + r.milliseconds, 0) / len
        this.#markline?.forceLock(average)
    }
}