import { createTab } from "@api/chrome/tab"
import { getCssVariable, getPrimaryTextColor, getSecondaryTextColor } from "@pages/util/style"
import { calJumpUrl } from "@popup/common"
import { t } from "@popup/locale"
import { sum } from "@util/array"
import { IS_SAFARI } from "@util/constant/environment"
import { isRtl } from "@util/document"
import { generateSiteLabel } from "@util/site"
import { formatPeriodCommon, formatTime, parseTime } from "@util/time"
import { type PieSeriesOption } from "echarts/charts"
import { type TitleComponentOption, type ToolboxComponentOption } from "echarts/components"
import { type CallbackDataParams } from "echarts/types/dist/shared"
import { type PercentageResult } from "./query"

function combineDate(start: Date, end: Date, format: string): string {
    const startStr = formatTime(start, format)
    const endStr = formatTime(end, format)
    if (startStr === endStr) {
        return startStr
    }
    const normalStr = `${startStr}-${endStr}`

    const sy = start.getFullYear()
    const ey = end.getFullYear()
    if (sy !== ey) {
        // Different years
        return normalStr
    }

    // The same years
    const execRes = /({d}|{m})[^{}]*({d}|{m})/.exec(format)
    let monthDatePart = execRes?.[0]

    if (!monthDatePart) return normalStr

    const newPart = `${monthDatePart}-${monthDatePart.replace('{m}', '{em}').replace('{d}', '{ed}')}`
    const newFormat = format.replace(monthDatePart, newPart)
    const em = end.getMonth() + 1
    const ed = end.getDate()
    return formatTime(start, newFormat)
        .replace('{em}', em.toString().padStart(2, '0'))
        .replace('{ed}', ed.toString().padStart(2, '0'))
}

function formatDateStr(date: Date | [Date, Date?] | undefined, dataDate: [string, string]): string {
    const format = t(msg => msg.calendar.dateFormat)

    if (!date) {
        date = dataDate?.map(parseTime) as [Date, Date]
    }
    if (!date) return ''
    if (!(date instanceof Array)) {
        // Single day
        return formatTime(date, format)
    }

    const [start, end] = date
    return end ? combineDate(start, end, format) : formatTime(start, format)
}

function formatTotalStr(rows: timer.stat.Row[], type: timer.core.Dimension | undefined): string {
    if (type === 'focus') {
        const total = sum(rows.map(r => r?.focus ?? 0))
        const totalTime = formatPeriodCommon(total)
        return t(msg => msg.content.percentage.totalTime, { totalTime })
    } else if (type === 'time') {
        const totalCount = sum(rows.map(r => r.time ?? 0))
        return t(msg => msg.content.percentage.totalCount, { totalCount })
    } else {
        return ''
    }
}

function calculateSubTitleText(result: PercentageResult): string {
    let { date, dataDate, rows, query: { type } = {} } = result
    const dateStr = dataDate ? formatDateStr(date, dataDate) : ''
    const totalStr = formatTotalStr(rows, type)
    let parts = [totalStr, dateStr].filter(str => !!str)
    isRtl() && (parts = parts.reverse())
    return parts.join(' @ ')
}

export function generateTitleOption(result: PercentageResult, suffix?: string): TitleComponentOption {
    return {
        text: [result?.chartTitle, suffix].filter(v => !!v).join(' - '),
        subtext: calculateSubTitleText(result),
        left: 'center',
        textStyle: { color: getPrimaryTextColor() },
        subtextStyle: { color: getSecondaryTextColor() },
        top: 15,
    }
}

export function generateToolboxOption(): ToolboxComponentOption {
    return {
        show: true,
        top: 5,
        right: 5,
        feature: {
            saveAsImage: {
                show: true,
                title: t(msg => msg.content.percentage.saveAsImageTitle),
                // file name
                name: 'Time_Tracker_Percentage',
                excludeComponents: ['toolbox'],
                pixelRatio: 7,
                backgroundColor: getCssVariable('--el-card-bg-color', '.el-card'),
            },
        }
    }
}

type ChartRow = timer.stat.Row & { isOther?: boolean }

const otherChartRow = (): ChartRow => ({
    siteKey: {
        host: t(msg => msg.content.percentage.otherLabel, { count: 0 }),
        type: 'normal',
    },
    focus: 0,
    date: '0000-00-00',
    time: 0,
    isOther: true,
    iconUrl: undefined,
    alias: undefined,
})

function cvt2ChartRows(rows: timer.stat.Row[], type: timer.core.Dimension, itemCount: number): ChartRow[] {
    const popupRows: ChartRow[] = []
    const other = otherChartRow()
    let otherCount = 0
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (i < itemCount) {
            popupRows.push(row)
        } else {
            other.focus += row.focus
            otherCount++
        }
    }
    const { siteKey } = other
    siteKey && (siteKey.host = t(msg => msg.content.percentage.otherLabel, { count: otherCount }))
    popupRows.push(other)
    const data = popupRows.filter(item => !!item[type])
    return data
}

// The declaration of data item
export type PieSeriesItemOption = Exclude<PieSeriesOption['data'], undefined>[0]
    & Pick<ChartRow, 'siteKey' | 'cateKey' | 'iconUrl' | 'isOther'>

// The declarations of labels
type PieLabelRichOption = Exclude<PieSeriesOption['label'], undefined>['rich']
type PieLabelRichValueOption = Exclude<PieLabelRichOption, undefined>[string]

const LABEL_FONT_SIZE = 13
const LABEL_ICON_SIZE = 13
const BASE_LABEL_RICH_VALUE: PieLabelRichValueOption = {
    height: LABEL_ICON_SIZE,
    width: LABEL_ICON_SIZE,
    fontSize: LABEL_FONT_SIZE,
}

const legend2LabelStyle = (legend: string): string => {
    if (!legend) return ''
    const code: string[] = []
    for (let i = 0; i < legend.length; i++) {
        code.push(legend.charCodeAt(i).toString(36).padStart(3, '0'))
    }
    return code.join('')
}

type CallbackFormat = {
    name: string
    value: number
    data: PieSeriesItemOption
    percent: number
}

function formatLabel(params: CallbackDataParams): string {
    const format = (Array.isArray(params) ? params[0] : params) as CallbackFormat
    const { name, data } = format || {}
    const { siteKey, isOther, iconUrl } = (data as PieSeriesItemOption) || {}
    const { type } = siteKey || {}
    if (type === 'normal' && iconUrl && !isOther && !IS_SAFARI) {
        // Not supported to get favicon url in Safari
        return `{${legend2LabelStyle(name)}|} {a|${name}}`
    }
    return name
}

type CustomOption = Pick<
    PieSeriesOption,
    'center' | 'radius' | 'selectedMode' | 'minShowLabelAngle'
>

export function generateSiteSeriesOption(rows: timer.stat.Row[], result: PercentageResult, customOption: CustomOption): PieSeriesOption {
    const { displaySiteName, query: { type }, itemCount } = result || {}

    const chartRows = cvt2ChartRows(rows, type, itemCount)
    const iconRich: PieLabelRichOption = {}
    const data = chartRows.map(d => {
        const { siteKey, cateKey, alias, isOther, iconUrl } = d
        const host = siteKey?.host
        const legend = (displaySiteName ? (alias ?? host) : host) ?? ''
        const richValue: PieLabelRichValueOption = { ...BASE_LABEL_RICH_VALUE }
        iconUrl && (richValue.backgroundColor = { image: iconUrl })
        iconRich[legend2LabelStyle(legend)] = richValue

        return { name: legend, value: d[type] || 0, siteKey, cateKey, isOther, iconUrl } satisfies PieSeriesItemOption
    })

    const textColor = getPrimaryTextColor()

    return {
        name: "NO_DATA",
        type: "pie",
        startAngle: 300,
        data,
        emphasis: {
            itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
            },
        },
        label: {
            formatter: formatLabel,
            color: textColor,
            rich: {
                a: { fontSize: LABEL_FONT_SIZE },
                ...iconRich,
            },
        },
        avoidLabelOverlap: true,
        ...customOption || {},
    }
}

function calculateAverageText(type: timer.core.Dimension, averageValue: number): string | undefined {
    if (type === 'focus') {
        return t(msg => msg.content.percentage.averageTime, { value: formatPeriodCommon(parseInt(averageValue.toFixed(0))) })
    } else if (type === 'time') {
        return t(msg => msg.content.percentage.averageCount, { value: averageValue.toFixed(1) })
    }
    return undefined
}

/**
 * Generate tooltip text
 */
export function formatTooltip({ query, dateLength }: PercentageResult, params: CallbackDataParams): string {
    const format = (Array.isArray(params) ? params[0] : params) as CallbackFormat
    const { name, value, percent, data } = format || {}

    const host = data.siteKey?.host
    // Host is null means cate tooltip
    const label = host ? generateSiteLabel(host, name) : name
    let result = label
    const itemValue = typeof value === 'number' ? value as number : 0
    const { type } = query
    const valueText = type === 'time' ? itemValue : formatPeriodCommon(itemValue)
    result += '<br/>' + valueText
    // Display percent only when query focus time
    type === 'focus' && (result += ` (${percent}%)`)
    if (!data.isOther && dateLength && dateLength > 1) {
        const averageValueText = calculateAverageText(type, itemValue / dateLength)
        averageValueText && (result += `<br/>${averageValueText}`)
    }
    return result
}

/**
 * Handle click
 */
export function handleClick(data: PieSeriesItemOption, date: PercentageResult['date'], type: timer.core.Dimension): void {
    const { siteKey, isOther } = data || {}
    if (!siteKey || isOther) return
    const url = calJumpUrl(siteKey, date, type)
    url && createTab(url)
}
