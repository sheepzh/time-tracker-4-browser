/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getWeekStartDay } from '@api/sw/option'
import { isCircle, type Circle, type DimensionEntry } from '@app/components/Analysis/types'
import { localRef, useProvide, useProvider, useRequest } from '@hooks'
import { locale } from '@i18n'
import { max, sum, toMap } from "@util/array"
import DateIterator from '@util/date-iterator'
import { daysAgo, formatTimeYMD, getDayLength, getWeekDay, getWeekStartTime, MILL_PER_DAY } from "@util/time"
import { computed, ref, type Ref } from "vue"
import { useAnalysisRows } from '../../context'

type Context = {
    dateRange: Ref<[number, number]>
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
    [start, end]: [number, number],
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
    for (const cursor of DateIterator.of(new Date(start), new Date(end))) {
        const date = formatTimeYMD(cursor)
        if (!bucket || circle === "daily" || getWeekDay(cursor) === weekStart) {
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

function lastRange(dateRange: [number, number]): [number, number] {
    const [start, end] = dateRange
    const dayLength = getDayLength(start, end)
    const newEnd = start - MILL_PER_DAY
    const newStart = start - MILL_PER_DAY * dayLength
    return [newStart, newEnd]
}

const NAMESPACE = 'siteAnalysis_trend'

export const initAnalysisTrend = () => {
    const circle = localRef<Circle>('analysis-circle', isCircle, 'daily')
    const { data: weekStart } = useRequest(getWeekStartDay, { defaultValue: locale === "zh_CN" ? 0 : 6 })
    const align2Week = ([start, end]: [number, number]): [number, number] =>
        [getWeekStartTime(start, weekStart.value), getWeekStartTime(end, weekStart.value) + MILL_PER_DAY * 6]

    const [defaultStart, defaultEnd] = daysAgo(14, 0)
    const dateRangeInner = ref<[number, number]>([defaultStart.getTime(), defaultEnd.getTime()])
    const dateRange = computed<[number, number], [number?, number?]>({
        get: () => circle.value === "daily" ? dateRangeInner.value : align2Week(dateRangeInner.value),
        set: ([s, e]) => s && e && (dateRangeInner.value = circle.value === "weekly" ? align2Week([s, e]) : [s, e]),
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