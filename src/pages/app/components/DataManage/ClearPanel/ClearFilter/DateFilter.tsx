/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t, tN } from "@app/locale"
import { dateFormat as elDateFormat } from "@i18n/element"
import { getDatePickerIconSlots } from "@pages/element-ui/rtl"
import { formatTime, getBirthday, MILL_PER_DAY } from "@util/time"
import { ElDatePicker } from "element-plus"
import type { Shortcut } from "element-plus/es/components/date-picker-panel/src/composables/use-shortcut"
import { defineComponent, type PropType, type StyleValue } from "vue"

const _default = defineComponent({
    emits: {
        change: (_date: [Date, Date]) => true
    },
    props: {
        dateRange: Object as PropType<[Date, Date]>
    },
    setup(props, ctx) {
        const yesterday = new Date().getTime() - MILL_PER_DAY
        const daysBefore = (days: number) => new Date(new Date().getTime() - days * MILL_PER_DAY)

        const birthday = getBirthday()
        const pickerShortcuts: Shortcut[] = [
            {
                text: t(msg => msg.calendar.range.tillYesterday),
                value: [birthday, daysBefore(1)],
            }, {
                text: t(msg => msg.calendar.range.tillDaysAgo, { n: 7 }),
                value: [birthday, daysBefore(7)],
            }, {
                text: t(msg => msg.calendar.range.tillDaysAgo, { n: 30 }),
                value: [birthday, daysBefore(30)],
            }
        ]
        const dateFormat = '{y}-{m}-{d}'
        const startPlaceholder = formatTime(birthday, dateFormat)
        const endPlaceholder = formatTime(yesterday, dateFormat)

        return () => (
            <p>
                <a style={{ marginInlineEnd: '10px' }}>1.</a>
                {tN(msg => msg.dataManage.filterDate, {
                    picker: <ElDatePicker
                        modelValue={props.dateRange}
                        onUpdate:modelValue={date => ctx.emit("change", date)}
                        size="small"
                        style={{ width: "250px" } satisfies StyleValue}
                        startPlaceholder={startPlaceholder}
                        endPlaceholder={endPlaceholder}
                        dateFormat={elDateFormat()}
                        type="daterange"
                        disabledDate={(date: Date) => date.getTime() > yesterday}
                        shortcuts={pickerShortcuts}
                        rangeSeparator="-"
                        v-slots={getDatePickerIconSlots()}
                    />
                })}
            </p>
        )
    }
})

export default _default
