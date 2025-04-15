/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useLocalStorage, useProvide, useProvider, useRequest } from "@hooks"
import { merge } from "@service/components/period-calculator"
import periodService from "@service/period-service"
import { keyOf, MAX_PERIOD_ORDER } from "@util/period"
import { getDayLength, MILL_PER_DAY } from "@util/time"
import { computed, reactive, toRaw, watch, type Reactive, type Ref } from "vue"
import { useHabitFilter } from "../context"
import type { FilterOption } from "./common"

type Value = {
    curr: timer.period.Row[]
    prev: timer.period.Row[]
}

export type PeriodRange = {
    curr: timer.period.KeyRange
    prev: timer.period.KeyRange
}

type Context = {
    value: Ref<Value>
    filter: Reactive<FilterOption>
    periodRange: Ref<PeriodRange>
}

const computeRange = (filterDateRange: [Date, Date]): PeriodRange => {
    const [startDate, endDate] = filterDateRange || []
    const dateLength = getDayLength(startDate, endDate)
    const prevStartDate = new Date(startDate.getTime() - MILL_PER_DAY * dateLength)
    const prevEndDate = new Date(startDate.getTime() - MILL_PER_DAY)
    return {
        curr: [keyOf(startDate, 0), keyOf(endDate, MAX_PERIOD_ORDER)],
        prev: [keyOf(prevStartDate, 0), keyOf(prevEndDate, MAX_PERIOD_ORDER)],
    }
}

const fetchRows = async (range: timer.period.KeyRange, periodSize: number) => {
    const results = await periodService.listBetween({ periodRange: range })
    const [start, end] = range || []
    return merge(results, { start, end, periodSize })
}

const NAMESPACE = 'habitPeriod'

export const initProvider = () => {
    const globalFilter = useHabitFilter()
    const periodRange = computed(() => computeRange(globalFilter.dateRange))
    const [cachedFilter, setFilterCache] = useLocalStorage<FilterOption>(
        'habit_period_filter', { periodSize: 1, chartType: 'average' }
    )
    const filter = reactive<FilterOption>(cachedFilter)
    watch(() => filter, () => setFilterCache(toRaw(filter)), { deep: true })

    const { data: value } = useRequest(async () => {
        const { curr: currRange, prev: prevRange } = periodRange.value || {}
        const periodSize = filter.periodSize
        const [curr, prev] = await Promise.all([
            fetchRows(currRange, periodSize),
            fetchRows(prevRange, periodSize),
        ])
        return { curr, prev }
    }, {
        deps: [periodRange, () => filter.chartType, () => filter.periodSize],
        defaultValue: { curr: [], prev: [] },
    })

    useProvide<Context>(NAMESPACE, { value, filter, periodRange })

    return filter
}

export const usePeriodValue = () => useProvider<Context, 'value'>(NAMESPACE, "value").value

export const usePeriodFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter

export const usePeriodRange = () => useProvider<Context, 'periodRange'>(NAMESPACE, "periodRange").periodRange