/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { StatDay } from '@/shared/day'
import { DateRangeFilter, TimeFormatFilter } from '@app/components/common/filter'
import { t } from '@app/locale'
import { useDayOffset } from '@hooks'
import { Flex } from '@pages/components'
import { defineComponent } from "vue"
import type { DateRangeShortcut } from '../common/filter/DateRangeFilter'
import { useHabitFilter } from "./context"

const buildShortcuts = (today: StatDay): DateRangeShortcut[] => [
    { text: t(msg => msg.calendar.range.today), value: today.rangeTo(0) },
    ...[3, 7, 15, 30, 180, 365].map(n =>
        ({ text: t(msg => msg.calendar.range.lastDays, { n }), value: today.addDays(-n).rangeTo(today) })),
]

const HabitFilter = defineComponent<{}>(() => {
    const filter = useHabitFilter()
    const { today } = useDayOffset()

    return () => (
        <Flex gap={10}>
            <DateRangeFilter
                clearable={false}
                modelValue={filter.dateRange}
                shortcuts={buildShortcuts(today.value)}
                onChange={range => range && (filter.dateRange = range)}
                disabledDate={d => d < today.value.addDays(-366)}
            />
            <TimeFormatFilter modelValue={filter.timeFormat} onChange={v => filter.timeFormat = v} />
        </Flex>
    )
})

export default HabitFilter