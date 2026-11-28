/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { StatRange } from '@/shared/day'
import { isCircle, type Circle, type DimensionEntry } from '@app/components/Analysis/types'
import { localRef, useDayOffset, useProvide, useProvider } from '@hooks'
import { max, sum, toMap } from "@util/array"
import DateIterator from '@util/date-iterator'
import { computed, ref, type Ref } from "vue"
import { useAnalysisRows } from '../../context'

type Context = {
    dateRange: Ref<StatRange>
    circle: Ref<Circle>
}

type DimensionType = 'focus' | 'visit'

type IndicatorSet = Record<DimensionType, {
    total: number
    average?: number
    max?: DimensionEntry
}> & {
    activeDay: number
}

type Dataset = {
    indicators: IndicatorSet
    focus: DimensionEntry[]
    visit: DimensionEntry[]
}

const indicatorOf = (entries: DimensionEntry[]) => {
    const total = sum(entries.map(e => e.value))
    const average = entries.length && total / entries.length
    return { max: max(entries, e => e.value), total, average }
}

function computeDataset(
    dateMap: Record<string, tt4b.stat.Row>,
    dateRange: StatRange,
    circle: Circle, weekStart: number,
): Dataset {
    const entries: Record<DimensionType, DimensionEntry[]> = { focus: [], visit: [] }
    let activeDay = 0
    let bucket: [string, ...string[]] | undefined
    let sum: Record<DimensionType, number> = { focus: 0, visit: 0 }
    const closeBucket = () => {
        if (!bucket) return
        const [date] = bucket
        const endDate = bucket.at(-1)
        entries.focus.push({ date, endDate, value: sum.focus })
        entries.visit.push({ date, endDate, value: sum.visit })
    }
    for (const day of DateIterator.of(dateRange, d => d)) {
        const date = day.toString()
        if (!bucket || circle === "daily" || day.weekday() === weekStart) {
            closeBucket()
            bucket = [date]
            sum = { focus: 0, visit: 0 }
        } else {
            bucket.push(date)
        }
        const { focus = 0, time = 0 } = dateMap[date] ?? {}
        sum.focus += focus
        sum.visit += time
        focus && activeDay++
    }
    closeBucket()

    return {
        indicators: { activeDay, focus: indicatorOf(entries.focus), visit: indicatorOf(entries.visit) },
        ...entries,
    }
}

const lastRange = (range: StatRange) => range.shift(-range.days())

const NAMESPACE = 'siteAnalysis_trend'

export const initAnalysisTrend = () => {
    const circle = localRef<Circle>('analysis-circle', isCircle, 'daily')
    const { today, weekStart } = useDayOffset()
    const dateRangeInner = ref<StatRange>()
    const dateRange = computed<StatRange>({
        get: () => {
            const ws = weekStart.value
            const range = dateRangeInner.value ?? today.value.rangeTo(-14)
            if (circle.value === 'daily') return range
            const { start, end } = range
            return start.weekStart(ws).rangeTo(end.weekStart(ws).addDays(6))
        },
        set: range => dateRangeInner.value = range,
    })
    const rows = useAnalysisRows()
    const rowMap = computed(() => rows.value && toMap(rows.value, r => r.date))
    const curr = computed(() => rowMap.value && computeDataset(rowMap.value, dateRange.value, circle.value, weekStart.value))
    const prev = computed(() => rowMap.value && computeDataset(rowMap.value, lastRange(dateRange.value), circle.value, weekStart.value))

    useProvide<Context>(NAMESPACE, { circle, dateRange })

    return { curr, prev }
}

export const useAnalysisTrendDateRange = () => useProvider<Context, 'dateRange'>(NAMESPACE, "dateRange").dateRange

export const useAnalysisTrendCircle = () => useProvider<Context, 'circle'>(NAMESPACE, "circle").circle