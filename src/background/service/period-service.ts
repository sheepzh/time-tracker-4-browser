/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { after, compare, getDateString } from "@/util/period"
import db from "@db/period-database"
import { merge } from "./components/period-calculator"

function dateStrBetween(startDate: timer.period.Key, endDate: timer.period.Key): string[] {
    const result: string[] = []
    while (compare(startDate, endDate) <= 0) {
        result.push(getDateString(startDate))
        startDate = after(startDate, 1)
    }
    return result
}

export async function selectPeriods(param: timer.period.Query): Promise<timer.period.Row[]> {
    let { range, size = 1 } = param
    if (!Number.isInteger(size) || size <= 1) size = 1

    if (range === undefined) {
        const results = await db.getAll()
        return merge(results, size)
    }
    const [start, end] = range
    const allDates = dateStrBetween(start, end)
    const results = await db.getBatch(allDates)
    return merge(results, size)
}

export async function batchDeletePeriods(start: timer.period.Key, end: timer.period.Key): Promise<void> {
    const allDates = dateStrBetween(start, end)
    await db.batchDelete(allDates)
}
