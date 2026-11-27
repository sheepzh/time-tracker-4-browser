/**
 * Copyright (c) 2024 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { StatRange } from '@/shared/day'
import { isTimeFormat } from '@app/util/types'
import { localReactive, useDayOffset, useProvide, useProvider } from '@hooks'
import { createObjectGuard } from 'typescript-guard'

type FilterOption = {
    timeFormat: tt4b.ui.TimeFormat
    dateRange: StatRange
}

type Context = {
    filter: FilterOption
}

const NAMESPACE = 'habit'

export const initHabit = () => {
    const { today } = useDayOffset()
    const dateRange = today.value.rangeTo(-7)
    const filter = localReactive<FilterOption, 'timeFormat'>(`${NAMESPACE}_filter`,
        createObjectGuard({ timeFormat: isTimeFormat }), { timeFormat: "default" }, { dateRange }
    )
    useProvide<Context>(NAMESPACE, { filter })
}

export const useHabitFilter = () => useProvider<Context, 'filter'>(NAMESPACE, "filter").filter