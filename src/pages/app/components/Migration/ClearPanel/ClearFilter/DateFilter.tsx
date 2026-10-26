/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t, tDateRangeSeparator, tN, tYMD } from "@app/locale"
import { cvt2LocaleDate } from '@app/util/time'
import { getDatePickerIconSlots } from '@pages/element-ui/rtl'
import type { ElDatePickerShortcut } from '@pages/element-ui/types'
import { addDays, getBirthday, getYesterday } from "@util/time"
import { ElDatePicker } from "element-plus"
import { defineComponent, type StyleValue } from "vue"

type Props = ModelValue<[Date, Date] | undefined>
const _default = defineComponent<Props>(props => {
    const birthday = getBirthday()
    const yesterday = getYesterday()
    const shortcuts: ElDatePickerShortcut[] = [{
        text: t(msg => msg.calendar.range.tillYesterday),
        value: [birthday, yesterday],
    }, {
        text: t(msg => msg.calendar.range.tillDaysAgo, { n: 7 }),
        value: [birthday, addDays(new Date(), -7)],
    }, {
        text: t(msg => msg.calendar.range.tillDaysAgo, { n: 30 }),
        value: [birthday, addDays(new Date(), -30)],
    }]

    return () => (
        <p>
            <a style={{ marginInlineEnd: '10px' }}>1.</a>
            {tN(msg => msg.dataManage.filterDate, {
                picker: <ElDatePicker
                    modelValue={props.modelValue}
                    onUpdate:modelValue={props.onChange}
                    size="small"
                    style={{ width: "250px" } satisfies StyleValue}
                    startPlaceholder={cvt2LocaleDate(birthday)}
                    endPlaceholder={cvt2LocaleDate(yesterday)}
                    format={tYMD()}
                    type="daterange"
                    disabledDate={(date: Date) => date > yesterday}
                    shortcuts={shortcuts}
                    rangeSeparator={tDateRangeSeparator()}
                    v-slots={getDatePickerIconSlots()}
                />
            })}
        </p>
    )
}, { props: ['modelValue', 'onChange'] })

export default _default
