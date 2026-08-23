/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isTimeFormat } from '@app/util/types'
import { localReactive, useProvide, useProvider } from '@hooks'
import { daysAgo } from "@util/time"
import { createObjectGuard } from 'typescript-guard'
import { reactive } from "vue"

type FilterOption = {
    timeFormat: tt4b.ui.TimeFormat
    dateRange: [number, number]
}

type CacheValue = Pick<FilterOption, 'timeFormat'>
const isCacheValue = createObjectGuard<CacheValue>({ timeFormat: isTimeFormat })

type Context = {
    filter: FilterOption
}

const NAMESPACE = 'habit'

export const initHabit = () => {
    const cached = localReactive<CacheValue>(`${NAMESPACE}_filter`, isCacheValue, {
        timeFormat: "default",
    })
    const [defaultStart, defaultEnd] = daysAgo(7, 0)
    const filter = reactive<FilterOption>({
        get timeFormat() { return cached.timeFormat },
        set timeFormat(val) { cached.timeFormat = val },
        dateRange: [defaultStart.getTime(), defaultEnd.getTime()],
    })
    useProvide<Context>(NAMESPACE, { filter })
}

export const useHabitFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter