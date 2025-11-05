/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from "@app/locale"
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { css } from '@emotion/css'
import { useXsState } from '@hooks/useMediaSize'
import { dateFormat } from "@i18n/element"
import Flex from '@pages/components/Flex'
import { getDatePickerIconSlots } from "@pages/element-ui/rtl"
import { isRtl } from '@util/document'
import { MILL_PER_DAY } from '@util/time'
import { type DatePickerProps, ElButton, ElDatePicker, ElText, useNamespace } from "element-plus"
import type { Shortcut } from "element-plus/es/components/date-picker-panel/src/composables/use-shortcut"
import { computed, defineComponent, type FunctionalComponent, type StyleValue, toRaw, toRef } from "vue"

const clearShortcut = (): Shortcut => ({
    text: t(msg => msg.button.clear),
    value: [new Date(0), new Date(0)],
})

type Value = [Date?, Date?]

type Props = ModelValue<Value> & {
    disabledDate?: (date: Date) => boolean
    startPlaceholder?: string
    endPlaceholder?: string
    shortcuts?: Shortcut[]
    clearable?: boolean
}

const ALL_PROPS: (keyof Props)[] = ["clearable", "disabledDate", "endPlaceholder", "modelValue", "onChange", "shortcuts", "startPlaceholder"]

const ARROW_BTN_STYLE: StyleValue = {
    padding: '8px 1px',
}

const usePopperStyle = () => {
    const pickerPanelNs = useNamespace('picker-panel')
    return css`
        & {
            .${pickerPanelNs.e('sidebar')} {
                width: 130px !important;
            }
            .${pickerPanelNs.b()} [slot="sidebar"] + .${pickerPanelNs.e('body')},
            .${pickerPanelNs.e('sidebar')} + .${pickerPanelNs.e('body')} {
                margin-inline-start: 130px !important
            }
        }
    `
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

const DefaultRange = defineComponent<Props>(props => {
    const rtl = isRtl()
    const {
        backwardDisabled,
        forwardDisabled,
        shift,
        shortcuts, clearable,
    } = useRange(props)

    const innerVal = computed(() => {
        const [start, end] = props.modelValue
        return start && end ? [start, end] : undefined
    })

    const handleUpdate = (innerVal: [Date, Date] | undefined) => {
        let value: Value = innerVal ?? [undefined, undefined]
        if (innerVal?.[0].getTime() === 0 && innerVal[1].getTime() === 0) {
            // clear shortcuts
            value = [undefined, undefined]
        }
        props.onChange?.(value)
    }

    return () => (
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
                modelValue={innerVal.value}
                format={dateFormat()}
                type="daterange"
                rangeSeparator="-"
                disabledDate={props.disabledDate}
                shortcuts={shortcuts.value}
                onUpdate:modelValue={newVal => handleUpdate(toRaw(newVal))}
                startPlaceholder={props.startPlaceholder}
                endPlaceholder={props.endPlaceholder}
                clearable={clearable.value}
                style={{
                    "--el-date-editor-width": "240px",
                    "--el-border-radius-base": 0,
                } satisfies StyleValue}
                popperClass={usePopperStyle()}
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
    )
}, { props: ALL_PROPS })

type XsDatePickerProps =
    & ModelValue<Date | undefined>
    & Partial<Pick<DatePickerProps, 'placeholder' | 'disabledDate' | 'clearable'>>

const XsDatePicker: FunctionalComponent<XsDatePickerProps> = props => {
    const inputNs = useNamespace('input')
    const cls = css`
        --el-date-editor-width: 120px;

        & .${inputNs.e('prefix')} {
            display: none;
        }
    `
    return (
        <ElDatePicker
            class={cls}
            modelValue={props.modelValue}
            onUpdate:modelValue={val => props.onChange?.(val)}
            placeholder={props.placeholder}
            disabledDate={props.disabledDate}
            clearable={props.clearable}
            format={dateFormat()}
        />
    )
}

const XsRange = defineComponent<Props>(props => {
    const handleChange = (start: Date | undefined, end: Date | undefined) => {
        const needReverse = start && end && start >= end
        const arr: [Date?, Date?] = needReverse ? [end, start] : [start, end]
        props.onChange?.(arr)
    }

    return () => (
        <Flex align='center' gap={2}>
            <XsDatePicker
                modelValue={props.modelValue[0]}
                onChange={val => handleChange(val, props.modelValue[1])}
                placeholder={props.startPlaceholder}
                disabledDate={props.disabledDate}
                clearable={props.clearable}
            />
            <ElText>-</ElText>
            <XsDatePicker
                modelValue={props.modelValue[1]}
                onChange={val => handleChange(props.modelValue[0], val)}
                placeholder={props.endPlaceholder}
                disabledDate={props.disabledDate}
                clearable={props.clearable}
            />
        </Flex>
    )
}, { props: ALL_PROPS })

const DateRangeFilterItem = defineComponent<Props>(props => {
    const isXs = useXsState()
    return () => isXs.value ? <XsRange {...props} /> : <DefaultRange {...props} />
}, { props: ALL_PROPS })

export default DateRangeFilterItem