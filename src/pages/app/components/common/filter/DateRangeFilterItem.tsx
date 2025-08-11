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

const DateRangeFilterItem = defineComponent<Props>(props => {
    const rtl = isRtl()

    const backwardDate = computed(() => {
        const start = props.modelValue?.[0]
        if (!start) return undefined
        const time = start.getTime()
        return new Date(time - MILL_PER_DAY)
    })
    const backwardDisabled = computed(() => {
        if (!backwardDate.value) return true
        const { disabledDate } = props
        if (!disabledDate) return false
        return disabledDate(backwardDate.value)
    })
    const forwardDate = computed(() => {
        const end = props.modelValue?.[1]
        if (!end) return undefined
        const time = end.getTime()
        return new Date(time + MILL_PER_DAY)
    })
    const forwardDisabled = computed(() => {
        if (!forwardDate.value) return true
        const { disabledDate } = props
        if (!disabledDate) return false
        return disabledDate(forwardDate.value)
    })

    const handleChange = (newVal: [Date, Date] | undefined) => {
        const [start, end] = newVal || []
        const isClearChosen = !start?.getTime?.() && !end?.getTime?.()
        if (isClearChosen) newVal = undefined
        props.onChange(newVal)
    }

    const clearable = toRef(props, "clearable", true)

    const shortcuts = () => {
        const { shortcuts: value } = props
        if (!value?.length || !clearable.value) return value
        return [...value, clearShortcut()]
    }

    const backward = () => {
        const { modelValue, onChange } = props
        backwardDate.value && modelValue && onChange([backwardDate.value, modelValue[1]])
    }
    const forward = () => {
        const { modelValue, onChange } = props
        forwardDate.value && modelValue && onChange([modelValue[0], forwardDate.value])
    }

    return () => (
        <span class="filter-item">
            <Flex gap={1} width="fit-content">
                <ElButton
                    disabled={backwardDisabled.value}
                    icon={rtl ? ArrowRight : ArrowLeft}
                    onClick={backward}
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
                    shortcuts={shortcuts()}
                    onUpdate:modelValue={newVal => handleChange(toRaw(newVal))}
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
                    onClick={forward}
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