/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import StatDay, { type StatRange } from '@/shared/day'
import { t, tDateRangeSeparator, tYMD } from "@app/locale"
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { css } from '@emotion/css'
import { useXsState } from '@hooks'
import { Flex } from '@pages/components'
import { getDatePickerIconSlots } from '@pages/element-ui/rtl'
import { ElDatePickerShortcut } from '@pages/element-ui/types'
import { useStatToday } from '@pages/element-ui/useStatToday'
import { isRtl } from '@util/document'
import { type DatePickerProps, ElButton, ElDatePicker, ElText, useNamespace } from "element-plus"
import { isInt } from 'typescript-guard'
import { computed, defineComponent, type FunctionalComponent, type StyleValue, toRaw, toRef } from "vue"

const clearShortcut = (): ElDatePickerShortcut => ({
    text: t(msg => msg.button.clear),
    value: [new Date(0), new Date(0)],
})

type Shortcut = { text: string, value: StatRange }

type Props = ModelValue<StatRange | undefined>
    & PartialPick<DatePickerProps, 'startPlaceholder' | 'endPlaceholder' | 'clearable'>
    & {
        shortcuts?: Shortcut[]
        disabledDate?: (d: StatDay) => boolean
        shiftStep?: number
    }

const ALL_PROPS: (keyof Props)[] = [
    "clearable", "disabledDate", "endPlaceholder", "modelValue", "onChange", "shortcuts", "shiftStep", "startPlaceholder",
]

const ARROW_BTN_STYLE: StyleValue = {
    padding: '8px 5px',
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
        return !start || !!props.disabledDate?.(start.prev())
    })

    const forwardDisabled = computed(() => {
        const end = props.modelValue?.[1]
        return !end || !!props.disabledDate?.(end.prev())
    })

    const shift = (multiple: number) => {
        const { modelValue, onChange, shiftStep = 1 } = props
        const [start, end] = modelValue ?? []
        if (!start || !end) return
        const daysDiff = shiftStep * multiple
        onChange?.(start.addDays(daysDiff).rangeTo(end.addDays(daysDiff)))
    }

    const clearable = toRef(props, "clearable", true)

    const shortcuts = computed(() => {
        const { shortcuts, clearable } = props
        if (!shortcuts?.length) return undefined
        const items: ElDatePickerShortcut[] = shortcuts.map(({ text, value }) =>
            ({ text, value: [value[0].toLabel(), value[1].toLabel()] }))
        return clearable ? [...items, clearShortcut()] : items
    })

    const disabledDate = (date: Date) => !!props.disabledDate?.(StatDay.ofLabel(date))

    return {
        backwardDisabled, forwardDisabled,
        shift, disabledDate,
        clearable, shortcuts,
    }
}

const cvt2Time = (data: unknown) => isInt(data) || data instanceof Date ? new Date(data) : undefined

const DefaultRange = defineComponent<Props>(props => {
    const rtl = isRtl()
    const {
        backwardDisabled,
        forwardDisabled,
        shift, disabledDate,
        shortcuts, clearable,
    } = useRange(props)
    const { cellClassName, statTodayPopoverCls } = useStatToday()

    const innerVal = computed(() => {
        if (!props.modelValue) return undefined
        const [start, end] = props.modelValue
        return [start.toLabel(), end.toLabel()]
    })

    const handleUpdate = (innerVal: unknown) => {
        const val = Array.isArray(innerVal) ? innerVal : []
        const start = cvt2Time(val[0])
        const end = cvt2Time(val[1])
        if (!start || !end || (!start.getTime() && !end.getTime())) {
            return props.onChange?.(undefined)
        }
        props.onChange?.(StatDay.ofLabel(start).rangeTo(StatDay.ofLabel(end)))
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
                format={tYMD()}
                type="daterange"
                rangeSeparator={tDateRangeSeparator()}
                disabledDate={disabledDate}
                cellClassName={cellClassName}
                shortcuts={shortcuts.value}
                onUpdate:modelValue={newVal => handleUpdate(toRaw(newVal))}
                startPlaceholder={props.startPlaceholder}
                endPlaceholder={props.endPlaceholder}
                clearable={clearable.value}
                style={{
                    "--el-date-editor-width": "240px",
                    "--el-border-radius-base": 0,
                } satisfies StyleValue}
                popperClass={[usePopperStyle(), statTodayPopoverCls]}
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
    & ModelValue<StatDay | undefined>
    & Partial<Pick<DatePickerProps, 'placeholder' | 'disabledDate' | 'clearable' | 'cellClassName' | 'popperClass'>>

const XsDatePicker: FunctionalComponent<XsDatePickerProps> = props => {
    const inputNs = useNamespace('input')
    const cls = css`
        --el-date-editor-width: 120px;

        & .${inputNs.e('prefix')} {
            display: none;
        }
    `
    const onChange = (unk: unknown) => {
        const time = cvt2Time(unk)
        props.onChange?.(time && StatDay.ofLabel(time))
    }
    return (
        <ElDatePicker
            class={cls}
            modelValue={props.modelValue?.toLabel()}
            onUpdate:modelValue={onChange}
            placeholder={props.placeholder}
            disabledDate={props.disabledDate}
            cellClassName={props.cellClassName}
            popperClass={props.popperClass}
            clearable={props.clearable}
            format={tYMD()}
        />
    )
}

const XsRange = defineComponent<Props>(props => {
    const { disabledDate } = useRange(props)
    const { cellClassName, statTodayPopoverCls } = useStatToday()
    const onChange = (s?: StatDay, e?: StatDay) => props.onChange?.(e && s?.rangeTo(e))

    return () => (
        <Flex align='center' gap={2}>
            <XsDatePicker
                modelValue={props.modelValue?.[0]}
                onChange={val => onChange(val, props.modelValue?.[1])}
                placeholder={props.startPlaceholder}
                disabledDate={disabledDate}
                cellClassName={cellClassName}
                popperClass={statTodayPopoverCls}
                clearable={props.clearable}
            />
            <ElText>-</ElText>
            <XsDatePicker
                modelValue={props.modelValue?.[1]}
                onChange={val => onChange(props.modelValue?.[0], val)}
                placeholder={props.endPlaceholder}
                disabledDate={disabledDate}
                cellClassName={cellClassName}
                popperClass={statTodayPopoverCls}
                clearable={props.clearable}
            />
        </Flex>
    )
}, { props: ALL_PROPS })

const DateRangeFilter = defineComponent<Props>(props => {
    const isXs = useXsState()
    return () => isXs.value ? <XsRange {...props} /> : <DefaultRange {...props} />
}, { props: ALL_PROPS })

export default DateRangeFilter