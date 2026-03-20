/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { cvtDateRange2Str } from '@/pages/app/util/time'
import { mergeDate, selectSite } from "@api/sw/stat"
import { useProvide, useProvider, useRequest } from "@hooks"
import { getDayLength } from "@util/time"
import { computed, type Ref } from "vue"
import { useHabitFilter } from "../context"

type Context = {
    rows: Ref<timer.stat.Row[]>
    dateMergedRows: Ref<timer.stat.Row[]>
}

const NAMESPACE = 'habitSite'

export const initProvider = () => {
    const filter = useHabitFilter()

    const { data: rows } = useRequest(() => selectSite({ date: cvtDateRange2Str(filter.dateRange) }), {
        deps: [() => filter.dateRange],
        defaultValue: [],
    })

    const dateRangeLength = computed(() => getDayLength(filter.dateRange?.[0], filter.dateRange?.[1]))

    const { data: dateMergedRowsRaw } = useRequest(() => mergeDate(rows.value ?? []), {
        deps: [() => rows.value],
        defaultValue: [],
    })
    const dateMergedRows = computed<timer.stat.Row[]>(() => (dateMergedRowsRaw.value ?? []) as timer.stat.Row[])
    const rowsRef = computed<timer.stat.Row[]>(() => (rows.value ?? []) as timer.stat.Row[])
    useProvide<Context>(NAMESPACE, { rows: rowsRef, dateMergedRows })

    return dateRangeLength
}

export const useRows = (): Ref<timer.stat.Row[]> => useProvider<Context, 'rows'>(NAMESPACE, "rows").rows

export const useDateMergedRows = (): Ref<timer.stat.Row[]> => useProvider<Context, 'dateMergedRows'>(NAMESPACE, 'dateMergedRows').dateMergedRows