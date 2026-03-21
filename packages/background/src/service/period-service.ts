/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import db from "@/background/database/period-database"
import { after, compare, getDateString } from "@util/period"
import { merge } from './components/period-calculator'

function dateStrBetween(startDate: timer.period.Key, endDate: timer.period.Key): string[] {
    const result: string[] = []
    while (compare(startDate, endDate) <= 0) {
        result.push(getDateString(startDate))
        startDate = after(startDate, 1)
    }
    return result
}

export async function selectPeriods(param: timer.period.Query): Promise<timer.period.Row[]> {
    const { range: [start, end], size = 1 } = param
    const allDates = dateStrBetween(start, end)
    const results = await db.getBatch(allDates)
    return merge(results, param)
}

export async function batchDeletePeriods(param: timer.period.Query): Promise<void> {
    const [start, end] = param.range
    const allDates = dateStrBetween(start, end)
    await db.batchDelete(allDates)
}
