/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { MILL_PER_DAY, MILL_PER_MINUTE } from "./time"

export const MINUTE_PER_PERIOD = 15
const PERIOD_PER_DATE = 24 * 60 / MINUTE_PER_PERIOD
export const MAX_PERIOD_ORDER = PERIOD_PER_DATE - 1
const MILL_PER_PERIOD = MINUTE_PER_PERIOD * MILL_PER_MINUTE

export function keyOf(time: Date | number, order?: number): timer.period.Key {
    time = time instanceof Date ? time : new Date(time)
    const year = time.getFullYear()
    const month = time.getMonth() + 1
    const date = time.getDate()
    order = order === undefined
        ? time.getHours() * 4 + Math.floor(time.getMinutes() / MINUTE_PER_PERIOD)
        : order
    return { year, month, date, order }
}

export function indexOf(key: timer.period.Key): number {
    if (!key) return 0
    const { year, month, date, order } = key
    return (year << 18)
        | (month << 14)
        | (date << 8)
        | order
}

export function compare(a: timer.period.Key, b: timer.period.Key): number {
    return indexOf(a) - indexOf(b)
}

export function after(key: timer.period.Key, orderCount: number): timer.period.Key {
    const date = new Date(key.year, key.month - 1, key.date, 0, (key.order + orderCount) * MINUTE_PER_PERIOD, 1)
    return keyOf(date)
}

export function startOfKey(key: timer.period.Key): Date {
    return new Date(key.year, key.month - 1, key.date, 0, MINUTE_PER_PERIOD * key.order)
}

export function getDateString(key: timer.period.Key) {
    return `${key.year}${key.month < 10 ? '0' : ''}${key.month}${key.date < 10 ? '0' : ''}${key.date}`
}

export function rowOf(endKey: timer.period.Key, duration?: number, milliseconds?: number): timer.period.Row {
    duration = duration || 1
    milliseconds = milliseconds || 0
    const date = getDateString(endKey)
    const endStart = startOfKey(endKey)
    const endTime = endStart.getTime() + MILL_PER_PERIOD
    const startTime = duration === 1 ? endStart.getTime() : endStart.getTime() - (duration - 1) * MILL_PER_PERIOD
    return { startTime, endTime, milliseconds, date }
}

function generateOrderMap(data: timer.period.Row[], periodSize: number): Map<number, number> {
    const map: Map<number, number> = new Map()
    data.forEach(item => {
        const key = Math.floor(startOrderOfRow(item) / periodSize)
        const val = map.get(key) || 0
        map.set(key, val + item.milliseconds)
    })
    return map
}

function startOrderOfRow(row: timer.period.Row): number {
    const d = new Date(row.startTime)
    return (d.getHours() * 60 + d.getMinutes()) / MINUTE_PER_PERIOD
}

function cvt2AverageResult(map: Map<number, number>, periodSize: number, dateNum: number): timer.period.Row[] {
    const result: timer.period.Row[] = []
    let period = keyOf(new Date(), 0)
    for (let i = 0; i < PERIOD_PER_DATE / periodSize; i++) {
        const key = period.order / periodSize
        const val = map.get(key) ?? 0
        const averageMill = Math.round(val / dateNum)
        result.push(rowOf(after(period, periodSize - 1), periodSize, averageMill))
        period = after(period, periodSize)
    }
    return result
}

export function averageByDay(data: timer.period.Row[], periodSize: number): timer.period.Row[] {
    if (!data?.length) return []
    const rangeStart = data[0]?.startTime
    const rangeEnd = data[data.length - 1]?.endTime
    const dateNum = (rangeEnd - rangeStart) / MILL_PER_DAY
    const map = generateOrderMap(data, periodSize)
    return cvt2AverageResult(map, periodSize, dateNum)
}
