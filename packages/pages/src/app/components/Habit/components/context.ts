/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { useProvide, useProvider } from "@hooks"
import { daysAgo } from "@util/time"
import { reactive, Reactive } from "vue"

export type FilterOption = {
    timeFormat: timer.app.TimeFormat
    dateRange: [Date, Date]
}

type Context = {
    filter: Reactive<FilterOption>
}

const NAMESPACE = 'habit'

export const initHabit = () => {
    const filter = reactive<FilterOption>({
        dateRange: daysAgo(7, 0),
        timeFormat: "default",
    })
    useProvide<Context>(NAMESPACE, { filter })
}

export const useHabitFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter