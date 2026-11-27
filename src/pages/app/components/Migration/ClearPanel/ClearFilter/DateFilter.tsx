/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { StatDay, type StatRange } from '@/shared/day'
import { t, tDateRangeSeparator, tN, tYMD } from "@app/locale"
import { getDatePickerIconSlots } from '@pages/element-ui/rtl'
import type { ElDatePickerShortcut } from '@pages/element-ui/types'
import { useStatToday } from '@pages/element-ui/useStatToday'
import { BIRTHDAY, cvt2LocaleDate } from '@pages/util/time'
import { ElDatePicker } from "element-plus"
import { computed, defineComponent, type StyleValue } from "vue"

type Props = ModelValue<StatRange | undefined>
const _default = defineComponent<Props>(props => {
    const { today, cellClassName, statTodayPopoverCls } = useStatToday()
    const yesterday = computed(() => today.value.prev())
    const shortcuts = computed<ElDatePickerShortcut[]>(() => [{
        text: t(msg => msg.calendar.range.tillYesterday),
        value: [BIRTHDAY, yesterday.value.toLabel()],
    }, {
        text: t(msg => msg.calendar.range.tillDaysAgo, { n: 7 }),
        value: [BIRTHDAY, today.value.addDays(-7).toLabel()],
    }, {
        text: t(msg => msg.calendar.range.tillDaysAgo, { n: 30 }),
        value: [BIRTHDAY, today.value.addDays(-30).toLabel()],
    }])

    const handleUpdate = (val: unknown) => {
        const [start, end] = Array.isArray(val) ? val : []
        const toChange = start instanceof Date && end instanceof Date
            ? StatDay.ofLabel(start).rangeTo(StatDay.ofLabel(end))
            : undefined
        props.onChange?.(toChange)
    }

    return () => (
        <p>
            <a style={{ marginInlineEnd: '10px' }}>1.</a>
            {tN(msg => msg.dataManage.filterDate, {
                picker: <ElDatePicker
                    modelValue={props.modelValue?.map(d => d.toLabel())}
                    onUpdate:modelValue={handleUpdate}
                    size="small"
                    style={{ width: "250px" } satisfies StyleValue}
                    startPlaceholder={cvt2LocaleDate(BIRTHDAY)}
                    endPlaceholder={cvt2LocaleDate(yesterday.value)}
                    format={tYMD()}
                    type="daterange"
                    disabledDate={(d: Date) => StatDay.ofLabel(d) > yesterday.value}
                    cellClassName={cellClassName}
                    popperClass={statTodayPopoverCls}
                    shortcuts={shortcuts.value}
                    rangeSeparator={tDateRangeSeparator()}
                    v-slots={getDatePickerIconSlots()}
                />
            })}
        </p>
    )
}, { props: ['modelValue', 'onChange'] })

export default _default
