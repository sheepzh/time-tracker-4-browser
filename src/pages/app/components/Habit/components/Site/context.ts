/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useProvide, useProvider, useRequest } from "@hooks"
import { selectSite } from "@service/stat-service"
import { mergeDate } from "@service/stat-service/merge/date"
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

    const { data: rows } = useRequest(() => selectSite({ date: filter.dateRange }), {
        deps: [() => filter.dateRange],
        defaultValue: [],
    })

    const dateRangeLength = computed(() => getDayLength(filter.dateRange?.[0], filter.dateRange?.[1]))

    const dateMergedRows = computed(() => mergeDate(rows.value ?? []))
    useProvide<Context>(NAMESPACE, { rows, dateMergedRows })

    return dateRangeLength
}

export const useRows = (): Ref<timer.stat.Row[]> => useProvider<Context, 'rows'>(NAMESPACE, "rows").rows

export const useDateMergedRows = (): Ref<timer.stat.Row[]> => useProvider<Context, 'dateMergedRows'>(NAMESPACE, 'dateMergedRows').dateMergedRows