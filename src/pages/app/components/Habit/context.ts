/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useProvide, useProvider } from '@hooks'
import { daysAgo } from "@util/time"
import { reactive, Reactive } from "vue"

export type FilterOption = {
    timeFormat: tt4b.ui.TimeFormat
    dateRange: [number, number]
}

type Context = {
    filter: Reactive<FilterOption>
}

const NAMESPACE = 'habit'

export const initHabit = () => {
    const [defaultStart, defaultEnd] = daysAgo(7, 0)
    const filter = reactive<FilterOption>({
        dateRange: [defaultStart.getTime(), defaultEnd.getTime()],
        timeFormat: "default",
    })
    useProvide<Context>(NAMESPACE, { filter })
}

export const useHabitFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter