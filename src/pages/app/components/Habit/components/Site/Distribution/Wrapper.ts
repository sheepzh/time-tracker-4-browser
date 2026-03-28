import { getPieBorderColor, getSeriesPalette } from "@app/util/echarts"
import { EchartsWrapper } from '@hooks'
import { t } from '@app/locale'
import { getPrimaryTextColor, getRegularTextColor } from '@pages/util/style'
import { groupBy, sum } from "@util/array"
import { getHost } from "@util/stat"
import { MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND } from "@util/time"
import {
    type ComposeOption,
    type LegendComponentOption,
    type PieSeriesOption,
    type TitleComponentOption
} from "echarts"
import {
    type GridOption,
    type TooltipOption,
    type TopLevelFormatterParams
} from "echarts/types/dist/shared"
import { computeAverageLen, generateTitleOption } from "../common"

export type BizOption = {
    rows: timer.stat.Row[]
    dateRange: [Date, Date]
}

type EcOption = ComposeOption<
    | GridOption
    | PieSeriesOption
    | TooltipOption
    | LegendComponentOption
>

type FocusUnit = 'm' | 'h' | 's'
const UNIT_CHANGE: { [unit in FocusUnit]: number } = {
    m: MILL_PER_MINUTE,
    s: MILL_PER_SECOND,
    h: MILL_PER_HOUR,
}
type FocusBound = [val: number, unit: FocusUnit]

const focusBoundMill = ([val, unit]: FocusBound) => (val ?? 0) * (UNIT_CHANGE[unit] ?? 0)

const FOCUS_COUNT_CATEGORIES: Tuple<FocusBound | undefined, 2>[] = [
    [, [5, 's']],
    [[5, 's'], [20, 's']],
    [[20, 's'], [60, 's']],
    [[1, 'm'], [10, 'm']],
    [[10, 'm'], [30, 'm']],
    [[30, 'm'], [60, 'm']],
    [[1, 'h'], [2, 'h']],
    [[2, 'h'], undefined],
]

const VISIT_COUNT_CATEGORIES: Tuple<number | undefined, 2>[] = [
    [, 1],
    [1, 3],
    [3, 10],
    [10, 20],
    [20, 50],
    [50, 100],
    [100, 200],
    [200, undefined]
]

const PALETTE_COLOR = getSeriesPalette()

const formatFocusLegend = (range: Tuple<FocusBound | undefined, 2>): string => {
    const [start, end] = range || []
    if (start && !end) {
        return `>=${start[0]}${start[1]}`
    } else if (!start && end) {
        return `<${end[0]}${end[1]}`
    } else if (start && end) {
        return start[1] === end[1]
            ? `${start[0]}-${end[0]}${start[1]}`
            : `${start[0]}${start[1]}-${end[0]}${end[1]}`
    } else {
        return 'NaN'
    }
}

const formatVisitLegend = (range: Tuple<number | undefined, 2>) => {
    const [start, end] = range || []
    if (!start && !end) {
        return 'NaN'
    } else if (start && !end) {
        return `>=${start}`
    } else if (!start && end) {
        return `<${end}`
    } else {
        return `${start}-${end}`
    }
}

const pieOptionOf = (centerX: string, data: PieSeriesOption['data']): PieSeriesOption => {
    return {
        type: 'pie',
        center: [centerX, '55%'],
        top: '16%',
        radius: ['45%', '80%'],
        label: {
            show: false,
            position: 'center',
            color: getRegularTextColor(),
        },
        itemStyle: {
            borderRadius: 4,
            borderColor: getPieBorderColor(),
            borderWidth: 0.5,
        },
        emphasis: {
            label: {
                show: true,
                fontSize: 17,
            },
        },
        tooltip: {
            formatter: (params: TopLevelFormatterParams) => {
                const param = Array.isArray(params) ? params[0] : params
                const data = param?.data || {} satisfies Exclude<PieSeriesOption['data'], undefined>[number]
                const { value } = data as { value: number }
                return `${t(msg => msg.habit.site.distribution.tooltip, { value })}`
            }
        },
        data,
        color: PALETTE_COLOR,
    }
}

const baseLegendTitle = (): TitleComponentOption => ({
    textStyle: {
        fontSize: 12,
        color: getPrimaryTextColor(),
        fontWeight: 'normal',
    },
    top: '18%',
})

function generateOption(bizOption: BizOption): EcOption {
    let { rows = [], dateRange } = bizOption || {}
    const [averageLen, _, exclusiveDate] = computeAverageLen(dateRange)
    if (exclusiveDate) {
        rows = rows.filter(r => r.date !== exclusiveDate)
    }

    const focusAve = groupBy(rows, r => getHost(r), l => sum(l.map(e => e.focus ?? 0)) / averageLen)
    const visitAve = groupBy(rows, r => getHost(r), l => sum(l.map(e => e.time ?? 0)) / averageLen)

    const focusGroup = groupBy(
        Object.entries(focusAve),
        ([_, ave]) => FOCUS_COUNT_CATEGORIES.findIndex(([start, end]) => (!start || focusBoundMill(start) <= ave) && (!end || focusBoundMill(end) > ave)),
        list => list,
    )
    const visitGroup = groupBy(
        Object.entries(visitAve),
        ([_, ave]) => VISIT_COUNT_CATEGORIES.findIndex(([start, end]) => (!start || start <= ave) && (!end || end > ave)),
        list => list,
    )
    const focusData: PieSeriesOption['data'] = FOCUS_COUNT_CATEGORIES.map((range, idx) => {
        const list = focusGroup[idx] || []
        return { range, list, value: list?.length ?? 0, name: formatFocusLegend(range) }
    })
    const visitData: PieSeriesOption['data'] = VISIT_COUNT_CATEGORIES.map((range, idx) => {
        const list = visitGroup[idx] || []
        return { range, list, value: list?.length ?? 0, name: formatVisitLegend(range) }
    })
    const primaryColor = getPrimaryTextColor()
    return {
        title: [
            // Main title
            generateTitleOption(t(msg => msg.habit.site.distribution.title)),
            // Legend title
            {
                text: t(msg => msg.habit.site.distribution.aveVisit),
                left: '6%',
                ...baseLegendTitle(),
            }, {
                text: t(msg => msg.habit.site.distribution.aveTime),
                right: '4%',
                ...baseLegendTitle(),
            },
        ],
        tooltip: { show: true },
        legend: [
            {
                type: 'scroll',
                left: '6%',
                top: '30%',
                orient: 'vertical',
                borderColor: getPieBorderColor(),
                textStyle: { color: primaryColor },
                data: VISIT_COUNT_CATEGORIES.filter((_, idx) => visitGroup[idx]).map(range => formatVisitLegend(range)),
            },
            {
                right: '4%',
                align: 'right',
                top: '30%',
                orient: 'vertical',
                borderColor: getPieBorderColor(),
                textStyle: { color: primaryColor },
                data: FOCUS_COUNT_CATEGORIES.filter((_, idx) => focusGroup[idx]).map(range => formatFocusLegend(range)),
            }
        ],
        grid: { top: '20%', bottom: '10%', left: 80, right: 50 },
        series: [
            pieOptionOf('35%', visitData),
            pieOptionOf('68%', focusData),
        ],
    }
}

export default class Wrapper extends EchartsWrapper<BizOption, EcOption> {
    generateOption = generateOption
}
