/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t } from "@app/locale"
import { ElSelect, ElTimePicker } from "element-plus"
import { computed, defineComponent, StyleValue } from "vue"

const ALL_MODES: timer.option.DarkMode[] = ["default", "on", "off", "timed"]
const labelOfMode = (mode: timer.option.DarkMode) => mode === 'default'
    ? t(msg => msg.option.followBrowser)
    : t(msg => msg.option.appearance.darkMode.options[mode])

function computeSecondToDate(secondOfDate: number): Date {
    const now = new Date()
    const hour = Math.floor(secondOfDate / 3600)
    const minute = Math.floor((secondOfDate - hour * 3600) / 60)
    const second = Math.floor(secondOfDate % 60)
    now.setHours(hour)
    now.setMinutes(minute)
    now.setSeconds(second)
    now.setMilliseconds(0)
    return now
}

function computeDateToSecond(date: Date) {
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
    return hour * 3600 + minute * 60 + second
}

type Props = {
    modelValue: timer.option.DarkMode
    startSecond?: number
    endSecond?: number
    onChange?: (darkMode: timer.option.DarkMode, [startSecond, endSecond]: [number?, number?]) => void
}

const _default = defineComponent<Props>(props => {
    const start = computed(() => props.startSecond && computeSecondToDate(props.startSecond))
    const end = computed(() => props.endSecond && computeSecondToDate(props.endSecond))

    return () => <>
        <ElSelect
            modelValue={props.modelValue}
            size="small"
            style={{ width: "120px" }}
            onChange={val => props.onChange?.(val as timer.option.DarkMode, [props.startSecond, props.endSecond])}
            options={ALL_MODES.map(value => ({ value, label: labelOfMode(value) }))}
        />
        {props.modelValue === "timed" && <>
            <ElTimePicker
                modelValue={start.value}
                size="small"
                style={{ marginInlineStart: "10px" } satisfies StyleValue}
                onUpdate:modelValue={val => props.onChange?.(props.modelValue, [computeDateToSecond(val), props.endSecond])}
                clearable={false}
            />
            <a>-</a>
            <ElTimePicker
                modelValue={end.value}
                size="small"
                onUpdate:modelValue={val => props.onChange?.(props.modelValue, [props.startSecond, computeDateToSecond(val)])}
                clearable={false}
            />
        </>}
    </>
}, { props: ['modelValue', 'startSecond', 'endSecond', 'onChange'] })

export default _default