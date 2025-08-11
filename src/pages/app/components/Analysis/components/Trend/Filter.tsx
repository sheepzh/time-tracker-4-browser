/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import DateRangeFilterItem from '@app/components/common/filter/DateRangeFilterItem'
import { t } from "@app/locale"
import { type ElementDatePickerShortcut } from "@pages/element-ui/date"
import { daysAgo } from "@util/time"
import { defineComponent } from "vue"
import { useAnalysisTrendDateRange } from "./context"

function datePickerShortcut(agoOfStart?: number, agoOfEnd?: number): ElementDatePickerShortcut {
    return {
        text: t(msg => msg.calendar.range.lastDays, { n: agoOfStart }),
        value: daysAgo((agoOfStart ?? 0) - 1 || 0, agoOfEnd || 0),
    }
}

const SHORTCUTS = [
    datePickerShortcut(7),
    datePickerShortcut(15),
    datePickerShortcut(30),
    datePickerShortcut(90),
]

const _default = defineComponent(() => {
    const dateRange = useAnalysisTrendDateRange()

    return () => (
        <DateRangeFilterItem
            modelValue={dateRange.value}
            disabledDate={(date: Date) => date.getTime() > new Date().getTime()}
            shortcuts={SHORTCUTS}
            clearable={false}
            onChange={newVal => newVal && (dateRange.value = newVal)}
        />
    )
})

export default _default