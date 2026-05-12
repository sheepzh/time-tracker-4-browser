import { getIconUrl, getRuntimeName } from "@api/chrome/runtime"
import { createTab } from "@api/chrome/tab"
import { generateQrCanvas } from "@pages/util/qrcode"
import { getCssVariable, getInfoColor, getPrimaryTextColor, getSecondaryTextColor } from "@pages/util/style"
import { calJumpUrl } from "@popup/common"
import { t } from '@popup/locale'
import { sum, toMap } from "@util/array"
import { IS_SAFARI } from "@util/constant/environment"
import { INSTALL_PAGE } from "@util/constant/url"
import { isRtl } from "@util/document"
import { generateSiteLabel } from "@util/site"
import { getGroupName, isGroup, isSite } from "@util/stat"
import { formatPeriodCommon, formatTime, parseTime } from "@util/time"
import type { PieSeriesOption, TitleComponentOption, ToolboxComponentOption } from "echarts"
import type { ECharts } from "echarts/core"
import type { CallbackDataParams, TopLevelFormatterParams } from "echarts/types/dist/shared"
import { ElMessage } from "element-plus"
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
    if (sy !== ey) return normalStr

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
        const start = parseTime(dataDate[0])
        const end = parseTime(dataDate[1])
        date = start ? [start, end] : undefined
    }
    if (!date) return ''
    // Single day
    if (!Array.isArray(date)) return formatTime(date, format)

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

    if (dateLength && dateLength > 0 && !isSingleDay) {
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

function snapshotChart(chart: ECharts, backgroundColor: string, connectedBackgroundColor: string): string {
    const pixelRatio = 7
    const isSvg = chart.getZr().painter.getType() === 'svg'
    return chart.getConnectedDataURL({
        type: isSvg ? 'svg' : 'png',
        pixelRatio,
        backgroundColor,
        connectedBackgroundColor,
        excludeComponents: ['toolbox'],
    })
}

async function getIconDataUrl(): Promise<string> {
    const res = await fetch(getIconUrl())
    if (!res.ok) throw new Error(`Failed to fetch extension icon: ${res.status}`)
    const blob = await res.blob()
    const type = blob.type || 'image/png'
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
    return `data:${type};base64,${btoa(binary)}`
}

async function saveWithWatermark(instance: ECharts) {
    const bgColor = getCssVariable('--el-card-bg-color', '.el-card')?.trim() ?? '#fff'
    const footerBgColor = getCssVariable('--el-fill-color-light')?.trim() ?? bgColor
    const textColor = getPrimaryTextColor()?.trim() ?? '#000'
    const subTextColor = getSecondaryTextColor()?.trim() ?? '#888'

    const chartDataUrl = snapshotChart(instance, bgColor, footerBgColor)

    const chartImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = chartDataUrl
    })

    const w = chartImg.width
    const footerHeight = Math.round(w * 0.14)
    const padding = Math.round(footerHeight * 0.15)
    const qrSize = footerHeight - padding * 2
    const nameFontSize = Math.round(footerHeight * 0.28)
    const subFontSize = Math.round(footerHeight * 0.18)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = chartImg.height + footerHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('2D canvas context unavailable')

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(chartImg, 0, 0)

    ctx.fillStyle = footerBgColor
    ctx.fillRect(0, chartImg.height, w, footerHeight)

    const footerTop = chartImg.height

    const qrCanvas = generateQrCanvas({ text: INSTALL_PAGE, size: qrSize })
    const qrX = w - padding - qrCanvas.width
    const qrY = footerTop + Math.round((footerHeight - qrCanvas.height) / 2)
    ctx.drawImage(qrCanvas, qrX, qrY)

    const iconSize = Math.round(footerHeight * 0.5)
    const iconY = footerTop + Math.round((footerHeight - iconSize) / 2)
    const iconSrc = await getIconDataUrl()
    const iconImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = iconSrc
    })
    ctx.drawImage(iconImg, padding, iconY, iconSize, iconSize)

    const textX = padding + iconSize + Math.round(footerHeight * 0.1)
    ctx.textBaseline = 'middle'
    ctx.fillStyle = textColor
    ctx.font = `bold ${nameFontSize}px sans-serif`
    ctx.fillText(getRuntimeName(), textX, footerTop + Math.round(footerHeight * 0.35))

    ctx.font = `${subFontSize}px sans-serif`
    ctx.fillStyle = subTextColor
    const tipText = t(msg => msg.content.percentage.installTip)
    ctx.fillText(tipText, textX, footerTop + Math.round(footerHeight * 0.68))

    const link = document.createElement('a')
    link.hidden = true
    link.download = 'Time_Tracker_Percentage.png'
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const MY_SAVE_ICON = `
    path://M812.333229 702.996063c-46.845072 0-89.466408 18.430848-119.288544 51.132804
    L319.564027 536.79845a103.801512 103.801512 0 0 0 0-51.132804l373.480658-215.858509
    c29.822136 32.63796 72.443472 52.540716 119.288544 52.540716 90.87432-1.407912
    159.094057-69.563652 160.501969-160.437972C971.491282 71.03556 903.271546 1.407912
    812.333229 0c-90.87432 1.407912-160.437973 71.03556-161.90988 161.909881 0 9.91938
    1.471908 19.83876 2.87982 29.822136L282.638335 404.774702A160.629961 160.629961 0 0 0
    161.941879 350.698081C71.067558 352.169989 1.43991 420.453722 0.031998 511.328042
    c1.407912 90.87432 71.03556 159.030061 161.909881 160.501969 46.845072 0 90.87432
    -21.310668 120.696456-54.012625l370.664834 214.450597c-1.407912 9.983376-2.815824
    19.83876-2.815824 31.230048 1.407912 90.87432 71.03556 159.094057 161.90988 160.501969
    90.87432-1.407912 159.030061-69.563652 160.437973-160.501969-1.407912-90.87432
    -69.563652-159.030061-160.501969-160.437972z
`.replace(/\s+/g, ' ').trim()

export function generateToolbox(getInstance: () => ECharts | undefined): ToolboxComponentOption {
    const toolboxIconColor = getPrimaryTextColor()?.trim() ?? '#5c6b7a'

    return {
        show: true,
        top: 5,
        right: 5,
        iconStyle: {
            color: toolboxIconColor,
            borderColor: toolboxIconColor,
            borderWidth: 0,
        },
        emphasis: {
            iconStyle: {
                color: toolboxIconColor,
                borderColor: toolboxIconColor,
                borderWidth: 0,
            },
        },
        feature: {
            mySave: {
                show: true,
                title: t(msg => msg.content.percentage.shareTitle),
                icon: MY_SAVE_ICON,
                onclick: () => {
                    const inst = getInstance()
                    if (!inst) return
                    inst && void saveWithWatermark(inst).catch(err => {
                        console.info(err)
                        ElMessage.error('Could not save the image.')
                    })
                },
            },
        },
    }
}

type OtherRow = Record<Exclude<timer.core.Dimension, 'run'>, number> & {
    other: true
    count: number
}

type ChartRow = timer.stat.Row | OtherRow

export const isOther = (row: ChartRow): row is OtherRow => 'other' in row

function cvt2ChartRows(rows: timer.stat.Row[], dimension: Exclude<timer.core.Dimension, 'run'>, itemCount: number): ChartRow[] {
    const sorted = rows.filter(item => !!item[dimension]).sort((a, b) => (b[dimension] ?? 0) - (a[dimension] ?? 0))
    const popupRows: ChartRow[] = []
    const other: OtherRow = { focus: 0, time: 0, count: 0, other: true }
    sorted.forEach((row, i) => {
        if (i < itemCount) {
            popupRows.push(row)
        } else {
            other.focus += row.focus
            other.time += row.time
            other.count++
        }
    })
    if (other.count) popupRows.push(other)
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

function formatLabel(params: CallbackDataParams, groupMap: Record<number, chrome.tabGroups.TabGroup>): string {
    const { name, data } = params
    const { row } = data as PieSeriesItemOption ?? {}

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

export function generateSiteSeriesOption(
    rows: timer.stat.Row[],
    result: PercentageResult,
    customOption: CustomOption,
): PieSeriesOption {
    const { displaySiteName, query: { dimension }, itemCount, groups, donutChart } = result
    const groupMap = toMap(groups, g => g.id)

    const chartRows = cvt2ChartRows(rows, dimension, itemCount)
    const iconRich: PieLabelRichOption = {}
    const data = chartRows.map(row => {
        const item: PieSeriesItemOption = { name: 'NaN', value: row[dimension], row }
        if (isOther(row)) {
            item.itemStyle = { color: getInfoColor() }
            item.name = t(msg => msg.content.percentage.otherLabel, { count: row.count })
        } else if (!isOther(row) && isSite(row as timer.stat.StatKey)) {
            const { siteKey, alias, iconUrl } = row as timer.stat.SiteRow
            const { host, type } = siteKey ?? {}
            const name = item.name = (displaySiteName ? (alias ?? host) : host) ?? ''
            const richValue: PieLabelRichValueOption = { ...BASE_LABEL_RICH_VALUE }
            if (type === 'normal' && iconUrl && !IS_SAFARI) {
                richValue.backgroundColor = { image: iconUrl }
            }
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
        ...customOption,
        ...adaptDonutSeries(donutChart, customOption.radius),
    }
}

export function adaptDonutSeries(
    donutChart: boolean,
    radius: CustomOption['radius'],
    donutRadiusRatio: number = 0.5,
): Pick<PieSeriesOption, 'itemStyle' | 'padAngle' | 'radius' | 'minAngle'> {
    return {
        ...donutChart ? {
            itemStyle: { borderRadius: 5 },
            padAngle: 1,
            minAngle: 1.5,
        } : {
            itemStyle: { borderRadius: 0 },
            padAngle: 0,
            minAngle: 0,
        },
        radius: calcRealRadius(donutChart, radius, donutRadiusRatio),
    }
}

function calcRealRadius(
    donutChart: boolean,
    radius: CustomOption['radius'],
    donutRadiusRatio: number = 0.5,
): CustomOption['radius'] {
    if (!donutChart) return radius
    if (!radius) return radius
    if (Array.isArray(radius)) return radius
    if (typeof radius === 'number') return [radius * donutRadiusRatio, radius]
    try {
        const percent = parseFloat(radius.replace('%', ''))
        const inner = percent * donutRadiusRatio
        return [`${inner}%`, radius]
    } catch {
        return radius
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
    const itemValue = typeof value === 'number' ? value : 0
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

        if (dateLength && dateLength > 1 && !isSingleDay) {
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
