/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { after, compare, indexOf, keyOf, rowOf, startOfKey } from "@/background/util/period"
import { sum } from "@util/array"

/**
 * @param timestamp current ts
 * @param milliseconds milliseconds
 * @returns results, can't be empty if milliseconds is positive
 */
export function calculate(timestamp: number, milliseconds: number): timer.period.Result[] {
    if (milliseconds <= 0) return []

    const key = keyOf(timestamp)
    const start = startOfKey(key)?.getTime()

    const currentResult = { ...key, milliseconds: 0 }
    const extraMill = timestamp - start
    const result: timer.period.Result[] = []
    if (extraMill < milliseconds) {
        // milliseconds including before period
        // 1st. add before ones
        const before = calculate(timestamp - extraMill - 1, milliseconds - extraMill)
        result.push(...before)
        // 2nd. shorten milliseconds
        currentResult.milliseconds = extraMill
    } else {
        // All is in current minute
        currentResult.milliseconds = milliseconds
    }
    result.push(currentResult)
    return result
}

export function merge(periods: timer.period.Result[], size: number): timer.period.Row[] {
    if (!periods?.length) return []

    const rows: timer.period.Row[] = []

    periods = periods.sort(compare)
    let start: timer.period.Key = periods[0]
    const end: timer.period.Key = periods[periods.length - 1]

    const map: Map<number, number> = new Map()
    periods.forEach(p => map.set(indexOf(p), p.milliseconds))
    let mills: number[] = []
    for (; compare(start, end) <= 0; start = after(start, 1)) {
        mills.push(map.get(indexOf(start)) ?? 0)
        const isEndOfWindow = (start.order % size) === size - 1
        if (isEndOfWindow) {
            const isFullWindow = mills.length === size
            isFullWindow && rows.push(rowOf(start, size, sum(mills)))
            mills = []
        }
    }
    return rows
}