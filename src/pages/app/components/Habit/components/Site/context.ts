/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { selectSite } from "@api/sw/stat"
import { useProvide, useProvider, useRequest } from '@hooks'
import { cvtDateRange2Str, getDayLength } from "@util/time"
import { computed, type ShallowRef } from "vue"
import { useHabitFilter } from "../context"

type Context = {
    rows: ShallowRef<timer.stat.Row[]>
    dateMergedRows: ShallowRef<timer.stat.Row[]>
}

const NAMESPACE = 'habitSite'

export const initProvider = () => {
    const filter = useHabitFilter()

    const { data: rows } = useRequest(() => selectSite({ date: cvtDateRange2Str(filter.dateRange) }), {
        deps: [() => filter.dateRange],
        defaultValue: [],
    })

    const dateRangeLength = computed(() => getDayLength(filter.dateRange?.[0], filter.dateRange?.[1]))

    const { data: dateMergedRows } = useRequest(() => selectSite({ date: cvtDateRange2Str(filter.dateRange), mergeDate: true }), {
        deps: [() => filter.dateRange],
        defaultValue: [],
    })
    useProvide<Context>(NAMESPACE, { rows, dateMergedRows })

    return dateRangeLength
}

export const useRows = (): ShallowRef<timer.stat.Row[]> => useProvider<Context, 'rows'>(NAMESPACE, "rows").rows

export const useDateMergedRows = (): ShallowRef<timer.stat.Row[]> => useProvider<Context, 'dateMergedRows'>(NAMESPACE, 'dateMergedRows').dateMergedRows