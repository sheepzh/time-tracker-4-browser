/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import DateRangeFilterItem from '@app/components/common/filter/DateRangeFilterItem'
import { t } from "@app/locale"
import { daysAgo } from "@util/time"
import type { Shortcut } from "element-plus/es/components/date-picker-panel/src/composables/use-shortcut"
import { defineComponent } from "vue"
import { useAnalysisTrendDateRange } from "./context"

const shortcut = (agoOfStart: number) => ({
    text: t(msg => msg.calendar.range.lastDays, { n: agoOfStart }),
    value: daysAgo(agoOfStart - 1, 0),
} satisfies Shortcut)

const SHORTCUTS = [7, 15, 30, 90].map(shortcut)

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