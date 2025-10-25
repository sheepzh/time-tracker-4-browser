/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import DateRangeFilterItem from "@app/components/common/filter/DateRangeFilterItem"
import TimeFormatFilterItem from "@app/components/common/filter/TimeFormatFilterItem"
import { t } from "@app/locale"
import Flex from "@pages/components/Flex"
import { type ElementDatePickerShortcut } from "@pages/element-ui/date"
import { daysAgo, MILL_PER_DAY } from "@util/time"
import { defineComponent } from "vue"
import { useHabitFilter } from "./context"

type ShortCutProp = [label: string, dayAgo: number]

const shortcutProps: ShortCutProp[] = [
    [t(msg => msg.calendar.range.today), 0],
    [t(msg => msg.calendar.range.lastDays, { n: 3 }), 3],
    [t(msg => msg.calendar.range.lastDays, { n: 7 }), 7],
    [t(msg => msg.calendar.range.lastDays, { n: 15 }), 15],
    [t(msg => msg.calendar.range.lastDays, { n: 30 }), 30],
    [t(msg => msg.calendar.range.lastDays, { n: 180 }), 180],
    [t(msg => msg.calendar.range.lastDays, { n: 365 }), 365],
]

const SHORTCUTS: ElementDatePickerShortcut[] = shortcutProps.map(([text, agoOfStart]) => ({ text, value: daysAgo(agoOfStart, 0) }))

const _default = defineComponent(() => {
    const filter = useHabitFilter()

    return () => (
        <Flex gap={10}>
            <DateRangeFilterItem
                clearable={false}
                modelValue={filter.dateRange}
                shortcuts={SHORTCUTS}
                onChange={([s, e]) => s && e && (filter.dateRange = [s, e])}
                disabledDate={d => d.getTime() < Date.now() - MILL_PER_DAY * 366}
            />
            <TimeFormatFilterItem
                modelValue={filter.timeFormat}
                onChange={v => filter.timeFormat = v}
            />
        </Flex>
    )
})

export default _default