/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { groupBy } from "@util/array"
import MonthIterator from '@util/month-iterator'
import { getBirthday, parseTime } from "@util/time"

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
type GistRow = {
    [host: string]: [
        number,     // Visit count
        number,     // Browsing time
    ]
}

function calcGroupKey(row: tt4b.core.Row): string | undefined {
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
function compress(rows: tt4b.core.Row[]): GistData {
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
export function divide2Buckets(rows: tt4b.core.Row[]): [string, GistData][] {
    const grouped: { [yearAndPart: string]: GistData } = groupBy(rows.filter(r => !!r), calcGroupKey, compress)
    return Object.entries(grouped)
}

/**
 * Calculate all the buckets between {@param startDate} and {@param endDate}
 */
export function calcAllBuckets(startDate: string | undefined, endDate: string | undefined) {
    const start = parseTime(startDate) ?? getBirthday()
    const end = parseTime(endDate) ?? new Date()
    return [...new MonthIterator(start, end)]
}

/**
 * Gist data 2 rows
 *
 * @param filename yearMonth
 * @param gistData gistData
 * @returns rows
 */
export function gistData2Rows(yearMonth: string, gistData: GistData): tt4b.core.Row[] {
    const result: tt4b.core.Row[] = []
    Object.entries(gistData).forEach(([dateOfMonth, gistRow]) => {
        const date = yearMonth + dateOfMonth
        Object.entries(gistRow).forEach(([host, val]) => {
            const [time, focus] = val
            const row: tt4b.core.Row = {
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