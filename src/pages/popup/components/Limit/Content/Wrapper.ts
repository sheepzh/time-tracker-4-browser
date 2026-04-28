import { EchartsWrapper } from '@hooks'
import { getColor, getInfoColor, getRegularTextColor, getSecondaryTextColor } from '@pages/util/style'
import { t } from '@popup/locale'
import { clamp } from '@util/number'
import { formatPeriodCommon, MILL_PER_SECOND } from '@util/time'
import type { ComposeOption, GaugeSeriesOption, LegendComponentOption, PieSeriesOption, TitleComponentOption, TooltipComponentOption } from 'echarts'

type EcOption = ComposeOption<
    | LegendComponentOption
    | TitleComponentOption
    | GaugeSeriesOption
    | PieSeriesOption
    | TooltipComponentOption
>

const MINUTES_PER_DAY = 24 * 60
const GAUGE_BG_COLOR = 'rgba(0, 0, 0, 0.12)'

const timeGaugeColor = () => getColor('primary') ?? '#409eff'
const visitGaugeColor = () => getColor('success') ?? '#67c23a'
const clockPointerColor = () => getColor('warning') ?? '#e6a23c'
const blockedPeriodColor = () => getColor('danger') ?? '#f56c6c'

type LimitDimension = 'time' | 'visit'

type ChartPart = {
    titles: TitleComponentOption[]
    series: (PieSeriesOption | GaugeSeriesOption)[]
}

const createTitle = (text: string, left: string): TitleComponentOption => {
    const textPrimary = getRegularTextColor()
    return {
        text,
        left,
        top: '13%',
        textAlign: 'center',
        width: 100,
        textStyle: { color: textPrimary, fontSize: 16, fontWeight: 'bold' },
    }
}

const createInfo = (text: string, left: string): TitleComponentOption => {
    const textSecondary = getSecondaryTextColor()
    return {
        text,
        left,
        bottom: '20%',
        textAlign: 'center',
        subtext: '',
        padding: 0,
        itemGap: 0,
        textStyle: { color: textSecondary, fontSize: 14, overflow: 'break', width: 140 },
    }
}

type GaugeOptions = {
    name: LimitDimension
    center: string
    usage: {
        used: number
        limit: number
    }
    color: string
}

const createGauge = (options: GaugeOptions): GaugeSeriesOption => {
    const { name, center, usage: { used, limit }, color } = options

    const percent = limit ? clamp((used * 100) / limit, 0, 100) : 40
    const percentText = `${percent.toFixed(1)}%`
    const usedText = name === 'time'
        ? formatPeriodCommon(used, true)
        : t(msg => msg.shared.limit.visits, { n: used })
    const progressText = name === 'time'
        ? `${usedText}/${formatPeriodCommon(limit, true)}`
        : t(msg => msg.shared.limit.visits, { n: `${used}/${limit}` })

    return {
        name,
        type: 'gauge',
        radius: '45%',
        center: [center, '50%'],
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        detail: {
            show: true,
            offsetCenter: [0, 0],
            fontSize: 13,
            color: getSecondaryTextColor(),
            width: 100,
            overflow: 'break',
            formatter: () => limit ? percentText : usedText,
        },
        tooltip: {
            formatter: () => `${percentText}<br/>${progressText}`,
        },
        silent: false,
        axisLine: { lineStyle: { width: 8, color: [[1, GAUGE_BG_COLOR]] } },
        progress: { show: limit > 0, width: 8, itemStyle: { color, borderCap: 'round' } },
        data: [{ value: percent }],
    }
}

class Wrapper extends EchartsWrapper<timer.limit.Item, EcOption> {
    private dimension: LimitDimension = 'time'
    protected replaceSeries = true

    init(container: HTMLDivElement): void {
        super.init(container)
        this.instance?.on('legendselectchanged', params => {
            const name = typeof params === 'object' && params && 'name' in params
                ? String((params as { name?: string }).name ?? '')
                : ''
            const next = name === 'visit' ? 'visit' : 'time'
            this.switchDimension(next)
        })
    }

    async render(biz: timer.limit.Item) {
        const firstRender = !this.lastBizOption
        if (firstRender) {
            const hasTimeLimit = !!biz.time || !!biz.weekly
            const hasVisitLimit = !!biz.count || !!biz.weeklyCount
            if (!hasTimeLimit && hasVisitLimit) this.dimension = 'visit'
        }
        await super.render(biz)
    }

    private switchDimension(next: LimitDimension) {
        if (this.dimension === next) return
        this.dimension = next
        this.lastBizOption && void this.render(this.lastBizOption)
    }

    private builtLimitPart(time: [number, number | undefined], visit: [number, number | undefined], leftPos: string): ChartPart {
        const noLimitText = t(msg => msg.limit.noLimit)

        const [timeUsed, timeLimit] = time
        const timeMax = timeLimit ? timeLimit * MILL_PER_SECOND : 0
        const timeLabel = timeMax
            ? t(msg => msg.limit.remain, { remaining: formatPeriodCommon(timeMax - timeUsed, true) })
            : noLimitText
        const timeOpts: GaugeOptions = {
            name: 'time', center: leftPos,
            usage: { limit: timeMax, used: timeUsed },
            color: timeGaugeColor(),
        }

        const [visitUsed, visitLimit] = visit
        const visitLabel = visitLimit
            ? t(msg => msg.shared.limit.visits, { n: `${visitUsed}/${visitLimit}` })
            : noLimitText
        const visitOpts: GaugeOptions = {
            name: 'visit', center: leftPos,
            usage: { limit: visitLimit ?? 0, used: visitUsed ?? 0 },
            color: visitGaugeColor(),
        }

        return {
            titles: [
                createInfo(this.dimension === 'visit' ? visitLabel : timeLabel, leftPos),
            ],
            series: [createGauge(timeOpts), createGauge(visitOpts)],
        }
    }

    private buildDailyPart(biz: timer.limit.Item, leftPos: string): ChartPart {
        const { time, waste, visit, count } = biz
        const basePart = this.builtLimitPart([waste, time], [visit, count], leftPos)
        basePart.titles.push(createTitle(t(msg => msg.shared.limit.daily), leftPos))
        return basePart
    }

    private buildWeeklyPart(biz: timer.limit.Item, rightPos: string): ChartPart {
        const { weekly = 0, weeklyWaste, weeklyVisit: weeklyVisitCount, weeklyCount = 0 } = biz
        const basePart = this.builtLimitPart([weeklyWaste, weekly], [weeklyVisitCount, weeklyCount], rightPos)
        basePart.titles.push(createTitle(t(msg => msg.shared.limit.weekly), rightPos))
        return basePart
    }

    private buildPeriodPart(periods: timer.limit.Period[] | undefined, leftPos: string): ChartPart {
        if (!periods?.length) return { titles: [], series: [] }
        const now = new Date()
        const nowMinutes = now.getHours() * 60 + now.getMinutes()

        const blocked = [...periods]
            .map(([s, e]) => ({ start: clamp(s, 0, MINUTES_PER_DAY), end: clamp(e, 0, MINUTES_PER_DAY) }))
            .filter(({ start, end }) => start < end)
            .sort((a, b) => a.start - b.start)

        const fmt = (m: number) =>
            `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

        // Gauge axisLine color segments (cumulative ratios 0→1)
        const gaugeColors: [number, string][] = []
        let last = 0
        for (const { start, end } of blocked) {
            if (start > last) gaugeColors.push([start / MINUTES_PER_DAY, GAUGE_BG_COLOR])
            gaugeColors.push([end / MINUTES_PER_DAY, blockedPeriodColor()])
            last = end
        }
        if (last < MINUTES_PER_DAY) gaugeColors.push([1, GAUGE_BG_COLOR])

        // Transparent pie as tooltip event layer (invisible, same ring area)
        type PieItem = { value: number; name: string; itemStyle: { color: string } }
        const firstStart = blocked[0].start
        const lastEnd = blocked[blocked.length - 1].end
        const startAngle = 90 - (lastEnd / MINUTES_PER_DAY) * 360
        const pieData: PieItem[] = [
            { value: MINUTES_PER_DAY - lastEnd + firstStart, name: '', itemStyle: { color: 'rgba(0,0,0,0)' } },
        ]
        for (let i = 0; i < blocked.length; i++) {
            const { start, end } = blocked[i]
            pieData.push({ value: end - start, name: `${fmt(start)} - ${fmt(end)}`, itemStyle: { color: 'rgba(0,0,0,0)' } })
            const nextStart = blocked[i + 1]?.start
            if (nextStart !== undefined && nextStart > end) {
                pieData.push({ value: nextStart - end, name: '', itemStyle: { color: 'rgba(0,0,0,0)' } })
            }
        }

        const hitPeriod = blocked.find(({ start, end }) => nowMinutes >= start && nowMinutes < end)
        const infoText = hitPeriod
            ? `${fmt(hitPeriod.start)} - ${fmt(hitPeriod.end)}`
            : t(msg => msg.limit.notHit)

        return {
            titles: [
                createTitle(t(msg => msg.shared.limit.period), leftPos),
                createInfo(infoText, leftPos),
            ],
            series: [
                {
                    type: 'gauge',
                    center: [leftPos, '50%'],
                    radius: '45%',
                    startAngle: 90,
                    endAngle: -270,
                    min: 0,
                    max: MINUTES_PER_DAY,
                    splitNumber: 4,
                    axisTick: {
                        splitNumber: 6,
                        length: 3,
                        lineStyle: { color: getSecondaryTextColor(), width: 1 },
                    },
                    axisLabel: {
                        distance: 10,
                        fontSize: 11,
                        color: getSecondaryTextColor(),
                        formatter: (val: number) => val === MINUTES_PER_DAY ? '' : String(val / 60),
                    },
                    axisLine: { lineStyle: { width: 8, color: gaugeColors } },
                    pointer: {
                        length: '50%',
                        width: 2,
                        itemStyle: { color: clockPointerColor() },
                    },
                    detail: { show: false },
                    data: [{ value: nowMinutes }],
                    silent: true,
                } as GaugeSeriesOption,
                {
                    type: 'pie',
                    center: [leftPos, '50%'],
                    radius: ['37%', '45%'],
                    startAngle,
                    label: { show: false },
                    emphasis: { scale: false },
                    itemStyle: { borderWidth: 0 },
                    tooltip: { formatter: ({ name }) => name },
                    data: pieData.filter(d => d.value > 0),
                } as PieSeriesOption,
            ],
        }
    }

    protected generateOption(biz: timer.limit.Item): Awaitable<EcOption> {
        const hasPeriods = !!biz.periods?.length
        const leftPos = hasPeriods ? '17.5%' : '32%'
        const centerPos = hasPeriods ? '50%' : undefined
        const rightPos = hasPeriods ? '82.5%' : '68%'

        const period = this.buildPeriodPart(biz.periods, leftPos)
        const daily = this.buildDailyPart(biz, centerPos ?? leftPos)
        const weekly = this.buildWeeklyPart(biz, rightPos)

        const inactiveColor = getInfoColor()

        return {
            title: [...period.titles, ...daily.titles, ...weekly.titles],
            tooltip: { show: true },
            legend: {
                orient: 'horizontal',
                bottom: '2%',
                left: 'center',
                icon: 'roundRect',
                itemWidth: 20,
                itemHeight: 12,
                itemGap: 16,
                selectedMode: 'single',
                inactiveColor,
                formatter: () => '',
                tooltip: { show: false },
                selected: { time: this.dimension === 'time', visit: this.dimension === 'visit' },
                data: [
                    { name: 'time' satisfies LimitDimension, itemStyle: { color: timeGaugeColor() } },
                    { name: 'visit' satisfies LimitDimension, itemStyle: { color: visitGaugeColor() } },
                ],
            },
            series: [...period.series, ...daily.series, ...weekly.series],
        }
    }
}

export default Wrapper