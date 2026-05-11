/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t, tN } from "@app/locale"
import { dateFormat as elDateFormat } from "@i18n/element"
import { getDatePickerIconSlots } from '@pages/element-ui/rtl'
import type { ElDatePickerShortcut } from '@pages/element-ui/types'
import { formatTime, getBirthday, MILL_PER_DAY } from "@util/time"
import { ElDatePicker } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"

type Props = ModelValue<[Date, Date] | undefined>
const _default = defineComponent<Props>(props => {
    const daysBefore = (days: number) => new Date(Date.now() - days * MILL_PER_DAY)
    const birthday = getBirthday()
    const yesterday = computed(() => Date.now() - MILL_PER_DAY)
    const dateFormat = computed(() => t(msg => msg.calendar.dateFormat))
    const shortcuts = computed((): ElDatePickerShortcut[] => [{
        text: t(msg => msg.calendar.range.tillYesterday),
        value: () => [birthday, daysBefore(1)],
    }, {
        text: t(msg => msg.calendar.range.tillDaysAgo, { n: 7 }),
        value: () => [birthday, daysBefore(7)],
    }, {
        text: t(msg => msg.calendar.range.tillDaysAgo, { n: 30 }),
        value: () => [birthday, daysBefore(30)],
    }])

    return () => (
        <p>
            <a style={{ marginInlineEnd: '10px' }}>1.</a>
            {tN(msg => msg.dataManage.filterDate, {
                picker: <ElDatePicker
                    modelValue={props.modelValue}
                    onUpdate:modelValue={props.onChange}
                    size="small"
                    style={{ width: "250px" } satisfies StyleValue}
                    startPlaceholder={formatTime(birthday, dateFormat.value)}
                    endPlaceholder={formatTime(yesterday.value, dateFormat.value)}
                    dateFormat={elDateFormat()}
                    type="daterange"
                    disabledDate={(date: Date) => date.getTime() > yesterday.value}
                    shortcuts={shortcuts.value}
                    rangeSeparator="-"
                    v-slots={getDatePickerIconSlots()}
                />
            })}
        </p>
    )
}, { props: ['modelValue', 'onChange'] })

export default _default
