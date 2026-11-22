/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isTimeFormat } from '@app/util/types'
import { localReactive, useProvide, useProvider } from '@hooks'
import { daysAgo } from '@pages/util/time'
import { createObjectGuard } from 'typescript-guard'

type FilterOption = {
    timeFormat: tt4b.ui.TimeFormat
    dateRange: [number, number]
}

type Context = {
    filter: FilterOption
}

const NAMESPACE = 'habit'

export const initHabit = () => {
    const [defaultStart, defaultEnd] = daysAgo(7, 0)
    const dateRange: [number, number] = [defaultStart.getTime(), defaultEnd.getTime()]
    const filter = localReactive<FilterOption, 'timeFormat'>(`${NAMESPACE}_filter`,
        createObjectGuard({ timeFormat: isTimeFormat }), { timeFormat: "default" }, { dateRange }
    )
    useProvide<Context>(NAMESPACE, { filter })
}

export const useHabitFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter