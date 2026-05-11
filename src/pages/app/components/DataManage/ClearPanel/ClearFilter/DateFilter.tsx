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
import { defineComponent, type StyleValue } from "vue"

const daysBefore = (days: number) => new Date(Date.now() - days * MILL_PER_DAY)
const BIRTHDAY = getBirthday()
const YESTERDAY = Date.now() - MILL_PER_DAY
const DATE_FORMAT = t(msg => msg.calendar.dateFormat)
const SHORTCUTS: ElDatePickerShortcut[] = [{
    text: t(msg => msg.calendar.range.tillYesterday),
    value: [BIRTHDAY, daysBefore(1)],
}, {
    text: t(msg => msg.calendar.range.tillDaysAgo, { n: 7 }),
    value: [BIRTHDAY, daysBefore(7)],
}, {
    text: t(msg => msg.calendar.range.tillDaysAgo, { n: 30 }),
    value: [BIRTHDAY, daysBefore(30)],
}]

type Props = ModelValue<[Date, Date] | undefined>
const _default = defineComponent<Props>(props => {

    return () => (
        <p>
            <a style={{ marginInlineEnd: '10px' }}>1.</a>
            {tN(msg => msg.dataManage.filterDate, {
                picker: <ElDatePicker
                    modelValue={props.modelValue}
                    onUpdate:modelValue={props.onChange}
                    size="small"
                    style={{ width: "250px" } satisfies StyleValue}
                    startPlaceholder={formatTime(BIRTHDAY, DATE_FORMAT)}
                    endPlaceholder={formatTime(YESTERDAY, DATE_FORMAT)}
                    dateFormat={elDateFormat()}
                    type="daterange"
                    disabledDate={(date: Date) => date.getTime() > YESTERDAY}
                    shortcuts={SHORTCUTS}
                    rangeSeparator="-"
                    v-slots={getDatePickerIconSlots()}
                />
            })}
        </p>
    )
}, { props: ['modelValue', 'onChange'] })

export default _default
