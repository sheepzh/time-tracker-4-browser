/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { dateFormat } from "@i18n/element"
import Flex from '@pages/components/Flex'
import { type ElementDatePickerShortcut } from "@pages/element-ui/date"
import { getDatePickerIconSlots } from "@pages/element-ui/rtl"
import { isRtl } from '@util/document'
import { MILL_PER_DAY } from '@util/time'
import { ElButton, ElDatePicker } from "element-plus"
import { computed, defineComponent, type StyleValue, toRaw, toRef } from "vue"

const clearShortcut = (): ElementDatePickerShortcut => ({
    text: t(msg => msg.button.clear),
    value: [new Date(0), new Date(0)],
})

type Props = {
    modelValue: [Date, Date] | undefined
    disabledDate?: (date: Date) => boolean
    startPlaceholder?: string
    endPlaceholder?: string
    shortcuts?: ElementDatePickerShortcut[]
    clearable?: boolean
    onChange: (val: [Date, Date] | undefined) => void
}

const ARROW_BTN_STYLE: StyleValue = {
    padding: '8px 1px',
}

const useRange = (props: Props) => {
    const backwardDisabled = computed(() => {
        const start = props.modelValue?.[0]
        if (!start) return true
        const { disabledDate } = props
        if (!disabledDate) return false
        const lastDay = new Date(start.getTime() - MILL_PER_DAY)
        return disabledDate(lastDay)
    })

    const forwardDisabled = computed(() => {
        const end = props.modelValue?.[1]
        if (!end) return true
        const { disabledDate } = props
        if (!disabledDate) return false
        const nextDate = new Date(end.getTime() + MILL_PER_DAY)
        return disabledDate(nextDate)
    })

    const shift = (dayNum: number) => {
        const { modelValue, onChange } = props
        const [start, end] = modelValue ?? []
        if (!start || !end) return
        const millDiff = MILL_PER_DAY * dayNum
        const newStart = new Date(start.getTime() + millDiff)
        const newEnd = new Date(end.getTime() + millDiff)
        onChange?.([newStart, newEnd])
    }

    const clearable = toRef(props, "clearable", true)

    const shortcuts = computed(() => {
        const { shortcuts: value } = props
        if (!value?.length || !clearable.value) return value
        return [...value, clearShortcut()]
    })

    return {
        backwardDisabled, forwardDisabled,
        shift,
        clearable, shortcuts,
    }
}

const DateRangeFilterItem = defineComponent<Props>(props => {
    const rtl = isRtl()
    const {
        backwardDisabled,
        forwardDisabled,
        shift,
        shortcuts, clearable,
    } = useRange(props)

    return () => (
        <span class="filter-item">
            <Flex gap={1} width="fit-content">
                <ElButton
                    disabled={backwardDisabled.value}
                    icon={rtl ? ArrowRight : ArrowLeft}
                    onClick={() => shift(-1)}
                    style={{
                        ...ARROW_BTN_STYLE,
                        ...rtl ? {
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                        } satisfies StyleValue : {
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                        } satisfies StyleValue,
                    }}
                />
                <ElDatePicker
                    modelValue={props.modelValue}
                    format={dateFormat()}
                    type="daterange"
                    rangeSeparator="-"
                    disabledDate={props.disabledDate}
                    shortcuts={shortcuts.value}
                    onUpdate:modelValue={newVal => props.onChange?.(toRaw(newVal) ?? undefined)}
                    startPlaceholder={props.startPlaceholder}
                    endPlaceholder={props.endPlaceholder}
                    clearable={clearable.value}
                    style={{
                        "--el-date-editor-width": "240px",
                        "--el-border-radius-base": 0,
                    } satisfies StyleValue}
                    v-slots={getDatePickerIconSlots()}
                />
                <ElButton
                    disabled={forwardDisabled.value}
                    icon={rtl ? ArrowLeft : ArrowRight}
                    onClick={() => shift(1)}
                    style={{
                        ...ARROW_BTN_STYLE,
                        ...rtl ? {
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                        } satisfies StyleValue : {
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                        } satisfies StyleValue,
                    }}
                />
            </Flex>
        </span>
    )
}, {
    props: ["clearable", "disabledDate", "endPlaceholder", "modelValue", "onChange", "shortcuts", "startPlaceholder"],
})

export default DateRangeFilterItem