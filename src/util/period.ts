/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { MILL_PER_MINUTE } from "./time"

export const MINUTE_PER_PERIOD = 15
export const PERIOD_PER_DATE = 24 * 60 / MINUTE_PER_PERIOD
export const MAX_PERIOD_ORDER = PERIOD_PER_DATE - 1
const MILL_PER_PERIOD = MINUTE_PER_PERIOD * MILL_PER_MINUTE

export function keyOf(time: Date | number, order?: number): tt4b.period.Key {
    time = time instanceof Date ? time : new Date(time)
    const year = time.getFullYear()
    const month = time.getMonth() + 1
    const date = time.getDate()
    order = order === undefined
        ? time.getHours() * 4 + Math.floor(time.getMinutes() / MINUTE_PER_PERIOD)
        : order
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
    const date = new Date(key.year, key.month - 1, key.date, 0, (key.order + orderCount) * MINUTE_PER_PERIOD, 1)
    return keyOf(date)
}

export function startOfKey(key: tt4b.period.Key): Date {
    return new Date(key.year, key.month - 1, key.date, 0, MINUTE_PER_PERIOD * key.order)
}

export function getDateString(key: tt4b.period.Key) {
    return `${key.year}${key.month < 10 ? '0' : ''}${key.month}${key.date < 10 ? '0' : ''}${key.date}`
}

export function rowOf(endKey: tt4b.period.Key, duration?: number, milliseconds?: number): tt4b.period.Row {
    duration = duration || 1
    milliseconds = milliseconds || 0
    const date = getDateString(endKey)
    const endStart = startOfKey(endKey)
    const endTime = endStart.getTime() + MILL_PER_PERIOD
    const startTime = duration === 1 ? endStart.getTime() : endStart.getTime() - (duration - 1) * MILL_PER_PERIOD
    return { startTime, endTime, milliseconds, date }
}
