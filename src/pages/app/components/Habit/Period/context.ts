/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { StatRange } from '@/shared/day'
import { listPeriods } from '@api/sw/period'
import { localReactive, useProvide, useProvider, useRequest } from '@hooks'
import { keyOf, MAX_PERIOD_ORDER } from "@util/period"
import { createObjectGuard } from 'typescript-guard'
import { computed, type ComputedRef, type Ref } from "vue"
import { useHabitFilter } from "../context"
import { isChartType, isPeriodSize, type ChartType, type PeriodRange, type PeriodSize } from './types'

type FilterOption = {
    periodSize: PeriodSize
    chartType: ChartType
}

const isFilterOption = createObjectGuard<FilterOption>({
    periodSize: isPeriodSize,
    chartType: isChartType,
})

type Data = {
    curr: tt4b.period.Row[]
    prev: tt4b.period.Row[]
}

type Context = {
    data: Ref<Data>
    filter: FilterOption
    range: ComputedRef<PeriodRange>
}

const computeRange = ([start, end]: StatRange): PeriodRange => {
    const dateLength = start.daysTo(end)
    return {
        curr: [keyOf(start.toDate(), 0), keyOf(end.toDate(), MAX_PERIOD_ORDER)],
        prev: [keyOf(start.addDays(-dateLength).toDate(), 0), keyOf(start.prev().toDate(), MAX_PERIOD_ORDER)],
    }
}

const NAMESPACE = 'habitPeriod'

export const initProvider = () => {
    const globalFilter = useHabitFilter()
    const periodRange = computed(() => computeRange(globalFilter.dateRange))
    const filter = localReactive<FilterOption>(
        'habit_period_filter', isFilterOption, { periodSize: 1, chartType: 'average' }
    )

    const { data } = useRequest(async () => {
        const { curr: currRange, prev: prevRange } = periodRange.value || {}
        const periodSize = filter.periodSize
        const [curr, prev] = await Promise.all([
            listPeriods({ range: currRange, size: periodSize }),
            listPeriods({ range: prevRange, size: periodSize }),
        ])
        return { curr, prev }
    }, {
        deps: [periodRange, () => filter.chartType, () => filter.periodSize],
        defaultValue: { curr: [], prev: [] },
    })

    useProvide<Context>(NAMESPACE, { data, filter, range: periodRange })

    return { filter, periodRange }
}

export const usePeriod = () => useProvider<Context, 'data' | 'filter' | 'range'>(NAMESPACE, 'data', 'range', 'filter')