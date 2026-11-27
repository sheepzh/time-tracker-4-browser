/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { MILL_PER_MINUTE, pad } from "./time"

export const MINUTE_PER_PERIOD = 15
export const PERIOD_PER_DATE = 24 * 60 / MINUTE_PER_PERIOD
export const MAX_PERIOD_ORDER = PERIOD_PER_DATE - 1
const MILL_PER_PERIOD = MINUTE_PER_PERIOD * MILL_PER_MINUTE

export function keyOf(ymd: Temporal.PlainDate, order: number): tt4b.period.Key {
    const { year, month, day: date } = ymd
    return { year, month, date, order }
}

export function indexOf(key: tt4b.period.Key): number {
    const { year, month, date, order } = key
    return (year << 18)
        | (month << 14)
        | (date << 8)
        | order
}

export function compare(a: tt4b.period.Key, b: tt4b.period.Key): number {
    return indexOf(a) - indexOf(b)
}

export function after(key: tt4b.period.Key, orderCount: number): tt4b.period.Key {
    const newOrder = key.order + orderCount
    const dayDelta = Math.floor(newOrder / PERIOD_PER_DATE)
    const { year, month, date } = key
    const day = Temporal.PlainDate.from({ year, month, day: date })
    return keyOf(day.add({ days: dayDelta }), newOrder - dayDelta * PERIOD_PER_DATE)
}

export function getDateString(key: tt4b.period.Key) {
    return `${pad(key.year, 4)}${pad(key.month, 2)}${key.date, 2}`
}

export function rowOf(endKey: tt4b.period.Key, duration?: number, milliseconds?: number): tt4b.period.Row {
    duration = duration || 1
    milliseconds = milliseconds || 0
    const date = getDateString(endKey)
    const endStart = new Date(endKey.year, endKey.month - 1, endKey.date, 0, MINUTE_PER_PERIOD * endKey.order)
    const endTime = endStart.getTime() + MILL_PER_PERIOD
    const startTime = duration === 1 ? endStart.getTime() : endStart.getTime() - (duration - 1) * MILL_PER_PERIOD
    return { startTime, endTime, milliseconds, date }
}
