/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { groupBy } from "@util/array"
import { formatTimeYMD, getBirthday, parseTime } from "@util/time"

/**
 * Data format in each json file in gist
 */
export type GistData = {
    /**
     * Index = month_of_part * 32 + date_of_month
     */
    [index: string]: GistRow
}

/**
 * Row stored in the gist
 */
export type GistRow = {
    [host: string]: [
        number,     // Visit count
        number,     // Browsing time
    ]
}

function calcGroupKey(row: timer.core.Row): string | undefined {
    const date = row.date
    if (!date) {
        return undefined
    }
    return date.substring(0, 6)
}

/**
 * Compress row array to gist row
 *
 * @param rows row array
 */
function compress(rows: timer.core.Row[]): GistData {
    const result: GistData = groupBy(
        rows,
        row => row.date.substring(6),
        groupedRows => {
            const gistRow: GistRow = {}
            groupedRows.forEach(({ host, focus, time }) => gistRow[host] = [time, focus])
            return gistRow
        }
    )
    return result
}

/**
 * Divide rows to buckets
 *
 * @returns [bucket, data][]
 */
export function divide2Buckets(rows: timer.core.Row[]): [string, GistData][] {
    const grouped: { [yearAndPart: string]: GistData } = groupBy(rows.filter(r => !!r), calcGroupKey, compress)
    return Object.entries(grouped)
}

/**
 * Calculate all the buckets between {@param startDate} and {@param endDate}
 */
export function calcAllBuckets(startDate: string | undefined, endDate: string | undefined) {
    endDate = endDate || formatTimeYMD(new Date())
    const result: string[] = []
    const start = parseTime(startDate) ?? getBirthday()
    const end = parseTime(endDate) ?? new Date()
    while (start < end) {
        result.push(formatTimeYMD(start))
        start.setMonth(start.getMonth() + 1)
    }
    const lastMonth = formatTimeYMD(end)
    !result.includes(lastMonth) && (result.push(lastMonth))
    return result
}

/**
 * Gist data 2 rows
 *
 * @param filename yearMonth
 * @param gistData gistData
 * @returns rows
 */
export function gistData2Rows(yearMonth: string, gistData: GistData): timer.core.Row[] {
    const result: timer.core.Row[] = []
    Object.entries(gistData).forEach(([dateOfMonth, gistRow]) => {
        const date = yearMonth + dateOfMonth
        Object.entries(gistRow).forEach(([host, val]) => {
            const [time, focus] = val
            const row: timer.core.Row = {
                date,
                host,
                time,
                focus
            }
            result.push(row)
        })
    })
    return result
}