import { createTab } from "@api/chrome/tab"
import { getCssVariable, getInfoColor, getPrimaryTextColor, getSecondaryTextColor } from "@pages/util/style"
import { calJumpUrl } from "@popup/common"
import { t } from "@popup/locale"
import { sum, toMap } from "@util/array"
import { IS_SAFARI } from "@util/constant/environment"
import { isRtl } from "@util/document"
import { generateSiteLabel } from "@util/site"
import { getGroupName, isGroup, isSite } from "@util/stat"
import { formatPeriodCommon, formatTime, parseTime } from "@util/time"
import { type PieSeriesOption } from "echarts/charts"
import { type TitleComponentOption, type ToolboxComponentOption } from "echarts/components"
import { type CallbackDataParams, type TopLevelFormatterParams } from "echarts/types/dist/shared"
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
    if (!Array.isArray(date)) {
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
    let { date, dataDate, rows, query: { dimension, duration } = {}, dateLength } = result
    const dateStr = dataDate ? formatDateStr(date, dataDate) : ''
    const totalStr = formatTotalStr(rows, dimension)
    let firstLineParts = [totalStr, dateStr].filter(s => !!s)
    isRtl() && (firstLineParts = firstLineParts.reverse())
    const firstLine = firstLineParts.join(' ')

    // Calculate average per day
    let averageStr = ''
    // Don't show averages for single-day durations (today/yesterday)
    const isSingleDay = duration === 'today' || duration === 'yesterday'

    if (dateLength && dateLength > 0 && !isSingleDay) {  // Changed: removed dimension check
        if (dimension === 'focus') {
            // Average time per day
            const total = sum(rows.map(r => r?.focus ?? 0))
            const averagePerDay = total / dateLength
            const averageTime = formatPeriodCommon(averagePerDay)
            averageStr = t(msg => msg.content.percentage.averageTime, { value: averageTime })
        } else if (dimension === 'time') {
            // Average visits per day
            const totalCount = sum(rows.map(r => r.time ?? 0))
            const averagePerDay = totalCount / dateLength
            const averageCount = averagePerDay.toFixed(1)
            averageStr = t(msg => msg.content.percentage.averageCount, { value: averageCount })
        }
    }

    return [firstLine, averageStr].filter(s => !!s).join('\n')
}

export function generateTitleOption(result: PercentageResult, suffix?: string): TitleComponentOption {
    return {
        text: [result?.chartTitle, suffix].filter(v => !!v).join(' - '),
        subtext: calculateSubTitleText(result),
        textStyle: { color: getPrimaryTextColor() },
        subtextStyle: { color: getSecondaryTextColor(), lineHeight: 15, fontSize: 12 },
        left: 'center',
        top: 14,
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

type OtherRow = Record<Exclude<timer.core.Dimension, 'run'>, number> & {
    other: true
    count: number
}

type ChartRow = timer.stat.Row | OtherRow

export const isOther = (row: ChartRow): row is OtherRow => 'other' in row

function cvt2ChartRows(rows: timer.stat.Row[], dimension: Exclude<timer.core.Dimension, 'run'>, itemCount: number): ChartRow[] {
    rows = rows.filter(item => !!item[dimension]).sort((a, b) => (b[dimension] ?? 0) - (a[dimension] ?? 0))
    const popupRows: ChartRow[] = []
    const other: OtherRow = { focus: 0, time: 0, count: 0, other: true }
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (i < itemCount) {
            popupRows.push(row)
        } else {
            other.focus += row.focus
            other.time += row.time
            other.count++
        }
    }
    other.count && popupRows.push(other)
    return popupRows
}

// The declaration of data item
export type PieSeriesItemOption = Exclude<PieSeriesOption['data'], undefined>[0]
    & { row: ChartRow }

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

function formatLabel(params: CallbackDataParams, groupMap: Record<number, chrome.tabGroups.TabGroup>): string {
    const format = (Array.isArray(params) ? params[0] : params) as CallbackFormat
    const { name, data } = format || {}
    const { row } = (data as PieSeriesItemOption) || {}

    if (!row) return 'NaN'
    if (isOther(row)) {
        const { count } = row
        return t(msg => msg.content.percentage.otherLabel, { count })
    } else if (isSite(row)) {
        const { siteKey, iconUrl } = row
        const { type } = siteKey || {}
        if (type === 'normal' && iconUrl && !IS_SAFARI) {
            // Not supported to get favicon url in Safari
            return `{${legend2LabelStyle(name)}|} {a|${name}}`
        }
    } else if (isGroup(row)) {
        return getGroupName(groupMap, row)
    }
    return name
}

type CustomOption = Pick<
    PieSeriesOption,
    'center' | 'radius' | 'selectedMode' | 'minShowLabelAngle'
>

export function generateSiteSeriesOption(rows: timer.stat.Row[], result: PercentageResult, customOption: CustomOption): PieSeriesOption {
    const { displaySiteName, query: { dimension }, itemCount, groups } = result || {}
    const groupMap = toMap(groups, g => g.id)

    const chartRows = cvt2ChartRows(rows, dimension, itemCount)
    const iconRich: PieLabelRichOption = {}
    const data = chartRows.map(row => {
        const item: PieSeriesItemOption = { name: 'NaN', value: row[dimension], row }
        if (isOther(row)) {
            item.itemStyle = { color: getInfoColor() }
            item.name = t(msg => msg.content.percentage.otherLabel, { count: row.count })
        } else if (isSite(row)) {
            const { siteKey, alias, iconUrl } = row
            const { host } = siteKey || {}
            const name = item.name = (displaySiteName ? (alias ?? host) : host) ?? ''
            const richValue: PieLabelRichValueOption = { ...BASE_LABEL_RICH_VALUE }
            iconUrl && (richValue.backgroundColor = { image: iconUrl })
            iconRich[legend2LabelStyle(name)] = richValue
        } else if (isGroup(row)) {
            item.name = getGroupName(groupMap, row)
        }

        return item
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
            formatter: params => formatLabel(params, groupMap),
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
export function formatTooltip({ query, dateLength }: PercentageResult, params: TopLevelFormatterParams): string {
    const format = (Array.isArray(params) ? params[0] : params)
    const { name, value, percent, data } = format ?? {}
    const { row } = data as PieSeriesItemOption
    const { dimension, duration } = query
    const itemValue = typeof value === 'number' ? value as number : 0
    let valueLine = dimension === 'time' ? itemValue : formatPeriodCommon(itemValue)
    // Display percent only when query focus time
    dimension === 'focus' && (valueLine += ` (${percent}%)`)
    let nameLine = name
    let averageLine: string | undefined = undefined
    if (!isOther(row)) {
        if (isSite(row)) {
            const { siteKey: { host } } = row
            nameLine = generateSiteLabel(host, name)
        }
        // Don't show averages for single-day durations (today/yesterday)
        const isSingleDay = duration === 'today' || duration === 'yesterday'

        if (dateLength && dateLength > 1 && !isSingleDay) {  // Changed: simplified condition
            averageLine = calculateAverageText(dimension, itemValue / dateLength)
        }
    }
    return [nameLine, valueLine, averageLine].filter(l => !!l).join('<br />')
}

/**
 * Handle click
 */
export function handleClick(data: PieSeriesItemOption, date: PercentageResult['date'], type: timer.core.Dimension): void {
    const { row } = data
    if (isOther(row)) {
        return
    }
    const url = calJumpUrl(row, date, type)
    url && createTab(url)
}
