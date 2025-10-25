/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { cvt2LocaleTime } from "@app/util/time"
import { useProvide, useProvider } from "@hooks"
import { toMap } from "@util/array"
import { daysAgo, getAllDatesBetween, getDayLength, MILL_PER_DAY } from "@util/time"
import { computed, onMounted, ref, watch, type Ref } from "vue"
import { useAnalysisRows } from "../../context"
import type { DimensionEntry } from "../../util"
import type { DimensionData } from "./Dimension"

type Context = {
    dateRange: Ref<[Date?, Date?]>
    rangeLength: Ref<number>
}

type DailyIndicator = {
    value: number | undefined
    date: string | undefined
}

type GlobalIndicator = number

type DimensionType = 'focus' | 'visit'

type IndicatorSet = Record<DimensionType, {
    max: DailyIndicator
    total: GlobalIndicator
    average: GlobalIndicator | undefined
}> & {
    activeDay: number
}

type SourceParam = {
    dateRange: [Date, Date]
    rows: timer.stat.Row[]
}

type EffectParam = {
    indicators: Ref<IndicatorSet | undefined>
    previousIndicators: Ref<IndicatorSet | undefined>
    focusData: Ref<DimensionData | undefined>
    visitData: Ref<DimensionData | undefined>
}

function computeIndicatorSet(
    rows: timer.stat.Row[],
    dateRange: [Date, Date] | undefined,
): [IndicatorSet | undefined, Record<string, timer.stat.Row | undefined>] {
    const [start, end] = dateRange || []
    const allDates = start && end ? getAllDatesBetween(start, end) : []
    if (!rows) {
        // No data
        return [undefined, toMap(allDates, date => date, _l => undefined)]
    }

    const days = allDates.length
    const periodRows = rows.filter(({ date }) => allDates.includes(date ?? ''))
    const periodRowMap = toMap(periodRows, r => r.date)
    let focusMax: DailyIndicator
    let visitMax: DailyIndicator
    let focusTotal: number, visitTotal: number, activeDay: number
    focusMax = visitMax = { date: undefined, value: undefined }
    activeDay = focusTotal = visitTotal = 0

    const fullPeriodRow: Record<string, timer.stat.Row> = {}
    allDates.forEach(date => {
        const row = periodRowMap[date]
        if (!(fullPeriodRow[date] = row)) return
        const { focus, time: visit } = row
        focus > (focusMax.value ?? Number.MIN_SAFE_INTEGER) && (focusMax = { value: focus, date })
        visit > (visitMax.value ?? Number.MIN_SAFE_INTEGER) && (visitMax = { value: visit, date })
        focusTotal += focus
        visitTotal += visit
        focus && (activeDay += 1)
    })

    const indicators: IndicatorSet = {
        activeDay,
        focus: { max: focusMax, total: focusTotal, average: days == 0 ? undefined : focusTotal / days },
        visit: { max: visitMax, total: visitTotal, average: days == 0 ? undefined : visitTotal / days },
    }
    return [indicators, fullPeriodRow]
}

function lastRange(dateRange: [Date, Date]): [Date, Date] | undefined {
    const [start, end] = dateRange || []
    if (!start || !end) return undefined
    const dayLength = getDayLength(start, end)
    const newEnd = new Date(start.getTime() - MILL_PER_DAY)
    const newStart = new Date(start.getTime() - MILL_PER_DAY * dayLength)
    return [newStart, newEnd]
}

function handleDataChange(source: SourceParam, effect: EffectParam) {
    const { dateRange, rows } = source
    const { indicators, previousIndicators, focusData, visitData } = effect
    // 1. this period
    const [newIndicators, periodRows] = computeIndicatorSet(rows, dateRange)
    indicators.value = newIndicators
    const newFocusData: DimensionEntry[] = []
    const newVisitData: DimensionEntry[] = []
    Object.entries(periodRows)
        .forEach(([rowDate, row]) => {
            const { time, focus } = row || {}
            const date = cvt2LocaleTime(rowDate)
            newFocusData.push({ date, value: focus || 0 })
            newVisitData.push({ date, value: time || 0 })
        })
    // 2. last period
    const prevDateRange = lastRange(dateRange)
    const [preIndicator, prePeriodRows] = computeIndicatorSet(rows, prevDateRange)
    previousIndicators.value = preIndicator
    const preFocusData: DimensionEntry[] = []
    const preVisitData: DimensionEntry[] = []
    Object.entries(prePeriodRows)
        .forEach(([rowDate, row]) => {
            const { time, focus } = row || {}
            const date = cvt2LocaleTime(rowDate)
            preFocusData.push({ date, value: focus || 0 })
            preVisitData.push({ date, value: time || 0 })
        })
    focusData.value = { thisPeriod: newFocusData, previousPeriod: preFocusData }
    visitData.value = { thisPeriod: newVisitData, previousPeriod: preVisitData }
}

const NAMESPACE = 'siteAnalysis_trend'

export const initAnalysisTrend = () => {
    const dateRange = ref(daysAgo(14, 0))
    const rangeLength = computed(() => getDayLength(dateRange.value?.[0], dateRange.value?.[1]))

    const visitData = ref<DimensionData>()
    const focusData = ref<DimensionData>()
    const indicators = ref<IndicatorSet>()
    const previousIndicators = ref<IndicatorSet>()
    const rows = useAnalysisRows()

    const computeEffect = () => handleDataChange(
        { dateRange: dateRange.value, rows: rows.value },
        { indicators, previousIndicators, visitData, focusData }
    )
    watch([dateRange, rows], computeEffect)
    onMounted(computeEffect)

    useProvide<Context>(NAMESPACE, { dateRange, rangeLength })

    return { visitData, focusData, indicators, previousIndicators }
}

export const useAnalysisTrendDateRange = () => useProvider<Context, 'dateRange'>(NAMESPACE, "dateRange").dateRange

export const useAnalysisTrendRangeLength = () => useProvider<Context, 'rangeLength'>(NAMESPACE, "rangeLength").rangeLength