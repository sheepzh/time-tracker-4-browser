/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { keyOf, MAX_PERIOD_ORDER } from "@/background/util/period"
import { selectPeriods } from '@api/sw/period'
import { useLocalStorage, useProvide, useProvider, useRequest } from '@hooks'
import { getDayLength, MILL_PER_DAY } from "@util/time"
import { computed, reactive, toRaw, watch, type Reactive, type Ref } from "vue"
import { useHabitFilter } from "../context"
import type { FilterOption } from "./types"

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
            selectPeriods({ range: currRange, size: periodSize }),
            selectPeriods({ range: prevRange, size: periodSize }),
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