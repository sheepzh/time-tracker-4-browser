/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import db from "@db/period-database"
import { after, compare, getDateString } from "@util/period"
import { merge } from "./components/period-calculator"

function dateStrBetween(startDate: tt4b.period.Key, endDate: tt4b.period.Key): string[] {
    const result: string[] = []
    while (compare(startDate, endDate) <= 0) {
        result.push(getDateString(startDate))
        startDate = after(startDate, 1)
    }
    return result
}

export async function selectPeriods(param: tt4b.period.Query): Promise<tt4b.period.Row[]> {
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

export async function batchDeletePeriods(start: tt4b.period.Key, end: tt4b.period.Key): Promise<void> {
    const allDates = dateStrBetween(start, end)
    await db.batchDelete(allDates)
}
