/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { StatDay } from '@/shared/day'
import { after, keyOf, MINUTE_PER_PERIOD, PERIOD_PER_DATE, rowOf } from '@util/period'

function startOrderOfRow(row: tt4b.period.Row): number {
    const d = new Date(row.startTime)
    return (d.getHours() * 60 + d.getMinutes()) / MINUTE_PER_PERIOD
}

function generateOrderMap(data: tt4b.period.Row[], periodSize: number): Map<number, number> {
    const map: Map<number, number> = new Map()
    data.forEach(item => {
        const key = Math.floor(startOrderOfRow(item) / periodSize)
        const val = map.get(key) || 0
        map.set(key, val + item.milliseconds)
    })
    return map
}

function cvt2AverageResult(map: Map<number, number>, periodSize: number, dateNum: number): tt4b.period.Row[] {
    const result: tt4b.period.Row[] = []
    let period = keyOf(Temporal.Now.plainDateISO(), 0)
    for (let i = 0; i < PERIOD_PER_DATE / periodSize; i++) {
        const key = period.order / periodSize
        const val = map.get(key) ?? 0
        const averageMill = Math.round(val / dateNum)
        result.push(rowOf(after(period, periodSize - 1), periodSize, averageMill))
        period = after(period, periodSize)
    }
    return result
}

export function averageByDay(
    data: tt4b.period.Row[],
    periodSize: number,
    range: tt4b.period.KeyRange,
): tt4b.period.Row[] {
    if (!data?.length) return []
    const dateNum = StatDay.ofPeriod(range[0]).daysTo(StatDay.ofPeriod(range[1])) || 1
    const map = generateOrderMap(data, periodSize)
    return cvt2AverageResult(map, periodSize, dateNum)
}
