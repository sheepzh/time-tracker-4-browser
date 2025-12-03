/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { fillExist } from "@service/components/import-processor"
import { AUTHOR_EMAIL } from "@src/package"
import { IS_WINDOWS } from "@util/constant/environment"
import { extractHostname, isBrowserUrl } from "@util/pattern"
import { formatTimeYMD, MILL_PER_SECOND } from "@util/time"

export type OtherExtension =
    | "webtime_tracker"
    | "web_activity_time_tracker"
    | "history_trends_unlimited"

const throwError = () => { throw new Error("Failed to parse, please check your file or contact the author via " + AUTHOR_EMAIL) }

/**
 * Parse the content to rows
 *
 * @param type extension type
 * @param file selected file
 * @returns row data
 */
export async function parseFile(ext: OtherExtension, file: File): Promise<timer.imported.Data> {
    // const worker = new Worker()
    let rows: timer.imported.Row[] = []
    let focus = false
    let time = false
    if (ext === 'web_activity_time_tracker') {
        [rows, time] = await parseWebActivityTimeTracker(file)
        focus = true
    } else if (ext === 'webtime_tracker') {
        rows = await parseWebtimeTracker(file)
        focus = true
    } else if (ext === 'history_trends_unlimited') {
        rows = await parseHistoryTrendsUnlimited(file)
        time = true
    }
    await fillExist(rows)
    return { rows, focus, time }
}

async function parseWebActivityTimeTracker(file: File): Promise<[timer.imported.Row[], time: boolean]> {
    const text = await file.text()
    if (isCsvFile(file)) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => !!line).splice(1)
        const rows = lines.map(line => {
            const [host, date, seconds] = line.split(',').map(cell => cell.trim())
            !host || !date || (!seconds && seconds !== '0') && throwError()
            const [year, month, day] = date.split('/')
            !year || !month || !day && throwError()
            const realDate = `${year}${month.length == 2 ? month : '0' + month}${day.length == 2 ? day : '0' + day}`
            return { host, date: realDate, focus: parseInt(seconds) * MILL_PER_SECOND, time: 0 } satisfies timer.imported.Row
        })
        return [rows, false]
    } else if (isJsonFile(file)) {
        return [parseWattJsonFile(text), true]
    } else {
        throw new Error("Invalid file format")
    }
}

type WattJsonItem = {
    url?: string
    favicon?: string
    summaryTime?: number
    counter?: number
    days?: {
        // new Date().toLocaleDateString("en-US") => "7/22/2023"
        // @see https://github.com/Stigmatoz/web-activity-time-tracker/blob/master/src/utils/date.ts#L6
        date?: string
        // seconds
        summary?: number
        // visit count
        counter?: number
    }[]
}

const parseWattJsonFile = (fileContent: string) => {
    const rows: timer.imported.Row[] = []
    const data = JSON.parse(fileContent) as WattJsonItem[]
    data.forEach(({ url: host, days }) => {
        if (!host) throw new Error("Invalid item without url")
        if (!days) throw new Error("Invalid item without days")
        days.forEach(({ date, summary, counter: time }) => {
            if (!date) throw new Error("Invalid day without date")
            if (!summary && !time) throw new Error("Invalid day without summary and counter")
            const [month, day, year] = date.split('/')
            if (!year || !month || !day) throw new Error("Invalid date format: " + date)
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            const realDate = formatTimeYMD(dateObj)
            rows.push({
                host,
                date: realDate,
                focus: (summary ?? 0) * MILL_PER_SECOND,
                time: time ?? 0,
            })
        })
    })
    return rows
}

type WebtimeTrackerBackup = {
    content: {
        domains: {
            [domain: string]: {
                name: string
                days: {
                    // date format: 2023-07-22
                    [date: string]: { seconds: number }
                }
            }
        }
    }
}

const WEBTIME_TRACKER_DATE_REG = /(\d{2})-(\d{2})-\d{2}/
const cvtWebtimeTrackerDate = (date: string): string | undefined => WEBTIME_TRACKER_DATE_REG.test(date) ? date.split('-').join('') : undefined

async function parseWebtimeTracker(file: File): Promise<timer.imported.Row[]> {
    const text = await file.text()
    if (isJsonFile(file)) {
        // JSON file by backup
        const data = JSON.parse(text) as WebtimeTrackerBackup
        const domains = data?.content?.domains || {}
        const rows: timer.imported.Row[] = Object.entries(domains)
            .flatMap(
                ([host, value]) => Object.entries(value?.days || {})
                    .map(([date, item]) => [host, cvtWebtimeTrackerDate(date), item?.seconds] as [string, string, number])
            )
            .filter(([host, date, seconds]) => host && date && seconds)
            .map(([host, date, seconds]) => ({
                host,
                date,
                focus: seconds * MILL_PER_SECOND
            } as timer.imported.Row))
        return rows
    } else if (isCsvFile(file)) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => !!line)
        const colHeaders = lines[0].split(',')
        const rows: timer.imported.Row[] = []
        lines.slice(1).forEach(line => {
            const cells = line.split(',')
            const host = cells[0]
            if (!host) return
            for (let i = 1; i < colHeaders?.length; i++) {
                const seconds = Number.parseInt(cells[i])
                const date = cvtWebtimeTrackerDate(colHeaders[i])
                seconds && date && rows.push({ host, date, focus: seconds * MILL_PER_SECOND, time: 0 })
            }
        })
        return rows
    }
    throw new Error("Invalid file format")
}

function parseHistoryTrendsUnlimitedLine(line: string, data: { [dateAndHost: string]: number }) {
    const cells = line.split('\t')
    const url = cells[0]
    if (isBrowserUrl(url)) return
    const tsMaybe = cells?.[1]?.trim?.()
    if (/^U\d{13,}(\.\d*)?$/.test(tsMaybe)) {
        // Backup data
        let date: string
        try {
            date = formatTimeYMD(parseFloat(tsMaybe.substring(1)))
        } catch {
            console.error("Invalid line: " + line)
            return
        }
        const host = extractHostname(url)?.host
        if (!host) return
        const key = date + host
        data[key] = (data[key] ?? 0) + 1
    } else {
        // Analyze data
        const host = cells[1]
        const dateStr = cells[4]
        const date = cvtWebtimeTrackerDate(dateStr?.substring(0, 10))
        if (!host || !date) return
        const key = date + host
        data[key] = (data[key] ?? 0) + 1
    }
}

async function parseHistoryTrendsUnlimited(file: File): Promise<timer.imported.Row[]> {
    const text = await file.text()
    if (isTsvFile(file)) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => !!line)
        const dailyVisits: { [dateAndHost: string]: number } = {}
        lines.forEach(line => parseHistoryTrendsUnlimitedLine(line, dailyVisits))
        return Object.entries(dailyVisits).map(([dateAndHost, time]) => {
            const date = dateAndHost.substring(0, 8)
            const host = dateAndHost.substring(8)
            return { date, host, time, focus: 0 } satisfies timer.imported.Row
        })
    }
    throw new Error("Invalid file format")
}

const isJsonFile = (file: File): boolean => matchFileTypeOrExtOnWin(file, 'application/json', '.json')

const isCsvFile = (file: File): boolean => matchFileTypeOrExtOnWin(file, 'text/csv', '.csv')

const isTsvFile = (file: File): boolean => matchFileTypeOrExtOnWin(file, 'text/tab-separated-values', '.tsv')

const matchFileTypeOrExtOnWin = (file: File, fileType: string, fileExtOnWin: string): boolean => {
    const { type, name } = file || {}
    return type?.startsWith(fileType) || (IS_WINDOWS && name?.toLowerCase()?.endsWith(fileExtOnWin))
}