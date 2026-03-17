/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { sum } from "@util/array"
import { after, compare, indexOf, keyOf, lastKeyOfLastDate, rowOf, startOfKey } from "@util/period"

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

/**
 * Found the max divisible period
 *
 * @param period key
 * @param periodWindowSize divisor
 */
export function getMaxDivisiblePeriod(period: timer.period.Key, periodWindowSize: number): timer.period.Key {
    const maxOrder = period.order
    let order = -1
    while (order <= maxOrder) order += periodWindowSize
    order -= periodWindowSize
    if (order === -1) return lastKeyOfLastDate(period)
    period.order = order
    return period
}

export type MergeConfig = {
    periodSize: number
    /**
     * Inclusive
     */
    start: timer.period.Key
    /**
     * Inclusive
     */
    end: timer.period.Key
}

export function merge(periods: timer.period.Result[], config: MergeConfig): timer.period.Row[] {
    if (!periods?.length) return []
    const result: timer.period.Row[] = []
    let { start, end, periodSize } = config
    const map: Map<number, number> = new Map()
    periods.forEach(p => map.set(indexOf(p), p.milliseconds))
    let mills: number[] = []
    for (; compare(start, end) <= 0; start = after(start, 1)) {
        mills.push(map.get(indexOf(start)) ?? 0)
        const isEndOfWindow = (start.order % periodSize) === periodSize - 1
        if (isEndOfWindow) {
            const isFullWindow = mills.length === periodSize
            isFullWindow && result.push(rowOf(start, periodSize, sum(mills)))
            mills = []
        }
    }
    return result
}