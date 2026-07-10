import { t } from '@app/locale'
import { ArrowDown, Filter } from '@element-plus/icons-vue'
import { useShadow, useSwitch } from '@hooks'
import Flex from '@pages/components/Flex'
import { MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND } from '@util/time'
import { ElBadge, ElButton, ElForm, ElFormItem, ElInput, ElPopover, ElSelect } from 'element-plus'
import { computed, type CSSProperties, defineComponent, type FunctionalComponent, ref, watch } from 'vue'

type Value = Tuple<number | undefined, 2>

type Props = {
    time?: Value
    focus?: Value
    onChange?: (time?: Value, focus?: Value) => void
}

const ALL_UNITS = ['h', 'm', 's'] as const
type Unit = typeof ALL_UNITS[number]
const MULTIPLIERS: Record<Unit, number> = {
    h: MILL_PER_HOUR,
    m: MILL_PER_MINUTE,
    s: MILL_PER_SECOND,
}
const PRECISIONS: Record<Unit, number> = {
    h: 2,
    m: 1,
    s: 0,
}

const mill2Str = (unit: Unit, mill: number | undefined): string => {
    if (mill === undefined) return ''
    const precision = PRECISIONS[unit]
    return (mill / MULTIPLIERS[unit]).toFixed(precision).replace(/\.?0+$/, '')
}

const cleanInput = (val: string, precision: number = 0): string => {
    let cleaned = val.replace(/[^\d.]/g, '')

    const firstDotIdx = cleaned.indexOf('.')
    if (firstDotIdx === -1) return cleaned

    const intPart = cleaned.slice(0, firstDotIdx)
    if (precision <= 0) return intPart

    const decPart = cleaned.slice(firstDotIdx + 1).replace(/\./g, '').slice(0, precision)

    return intPart + '.' + decPart
}

const str2Int = (str: string): number | undefined => {
    if (!str) return undefined
    const num = parseInt(str)
    return isNaN(num) || !isFinite(num) ? undefined : num
}

type Initial = {
    start: string
    end: string
    unit: Unit
}

const parseInitial = (defaultValue?: Value): Initial => {
    const [start, end] = defaultValue ?? []
    if ((start ?? end) === undefined) return { start: '', end: '', unit: 'm' }
    const min = Math.min(start ?? Infinity, end ?? Infinity)
    let unit: Unit
    if (min >= MILL_PER_HOUR) unit = 'h'
    else if (min >= MILL_PER_MINUTE) unit = 'm'
    else unit = 's'
    return { start: mill2Str(unit, start), end: mill2Str(unit, end), unit }
}

const INPUT_STYLE: CSSProperties = { width: '60px' }
type FocusRangeInputInstance = { clear: NoArgCallback }

const FocusRangeInput = defineComponent<ModelValue<Value | undefined>>((props, { expose }) => {
    const initial = parseInitial(props.modelValue)
    const start = ref<string>(initial.start)
    const end = ref<string>(initial.end)
    const unit = ref<Unit>(initial.unit)

    const clear = () => {
        start.value = ''
        end.value = ''
    }
    expose({ clear } satisfies FocusRangeInputInstance)

    watch([start, end, unit], () => {
        let s = start.value ? Number(start.value) : undefined
        let e = end.value ? Number(end.value) : undefined
        if (s !== undefined && (!isFinite(s) || isNaN(s))) return
        if (e !== undefined && (!isFinite(e) || isNaN(e))) return

        const multiplier = MULTIPLIERS[unit.value]
        // Round to integers
        s !== undefined && (s = Math.round(s * multiplier))
        e !== undefined && (e = Math.round(e * multiplier))
        props.onChange?.([s, e])
    })

    return () => <>
        <ElInput
            size='small'
            modelValue={start.value}
            onInput={v => start.value = cleanInput(v, PRECISIONS[unit.value])}
            style={INPUT_STYLE}
            placeholder='0'
        />
        &ensp;-&ensp;
        <ElInput
            size='small'
            modelValue={end.value}
            onInput={v => end.value = cleanInput(v, PRECISIONS[unit.value])}
            style={INPUT_STYLE}
            placeholder='∞'
        />
        &ensp;
        <ElSelect
            size='small'
            options={ALL_UNITS.map(u => ({ label: u, value: u }))}
            modelValue={unit.value}
            onChange={v => unit.value = v}
            style={{ width: '50px' }}
        />
    </>
}, { props: ['modelValue', 'onChange'] })

const TimeRangeInput: FunctionalComponent<ModelValue<Value | undefined>> = ({ modelValue, onChange }) => <>
    <ElInput
        size='small'
        modelValue={modelValue?.[0]}
        onInput={v => onChange?.([str2Int(cleanInput(v)), modelValue?.[1]])}
        style={INPUT_STYLE}
        placeholder='0'
    />
    &ensp;-&ensp;
    <ElInput
        size='small'
        modelValue={modelValue?.[1]}
        onInput={v => onChange?.([modelValue?.[0], str2Int(cleanInput(v))])}
        style={INPUT_STYLE}
        placeholder='∞'
    />
</>

const BTN_STYLE: CSSProperties = { padding: '8px' }
const Button: FunctionalComponent<{ handleClick?: NoArgCallback, popup: boolean, filtered: boolean }> = props => {
    const { handleClick, popup, filtered } = props
    const button = <ElButton plain icon={popup ? ArrowDown : Filter} style={BTN_STYLE} onClick={handleClick} />
    return filtered ? <ElBadge isDot>{button}</ElBadge> : button
}

const RangeFilter = defineComponent<Props>(props => {
    const [time, setTime, resetTime] = useShadow(() => props.time)
    const [focus, setFocus, resetFocus] = useShadow(() => props.focus)
    const filtered = computed(() => {
        const { focus, time } = props
        return (focus?.[0] ?? focus?.[1] ?? time?.[0] ?? time?.[1]) !== undefined
    })
    const [visible, , close, toggle] = useSwitch(false)

    const focusInput = ref<FocusRangeInputInstance>()

    const onClear = () => {
        setFocus([undefined, undefined])
        setTime([undefined, undefined])
        focusInput.value?.clear()
    }

    const onConfirm = () => {
        props.onChange?.(time.value, focus.value)
        close()
    }

    const onCancel = () => {
        resetFocus()
        resetTime()
        close()
    }

    return () => (
        <ElPopover
            visible={visible.value}
            trigger='click'
            width={300}
            persistent={false}
            v-slots={{
                default: () => (
                    <Flex column gap={10}>
                        <ElForm labelWidth={80} labelPosition='left' size='small'>
                            <ElFormItem label={t(msg => msg.item.focus)}>
                                <FocusRangeInput ref={focusInput} modelValue={focus.value} onChange={setFocus} />
                            </ElFormItem>
                            <ElFormItem label={t(msg => msg.item.time)}>
                                <TimeRangeInput modelValue={time.value} onChange={setTime} />
                            </ElFormItem>
                        </ElForm>
                        <Flex justify='end'>
                            <ElButton text size='small' onClick={onCancel}>
                                {t(msg => msg.button.cancel)}
                            </ElButton>
                            <ElButton size='small' type='info' onClick={onClear}>
                                {t(msg => msg.button.clear)}
                            </ElButton>
                            <ElButton size='small' type='primary' onClick={onConfirm}>
                                {t(msg => msg.button.confirm)}
                            </ElButton>
                        </Flex>
                    </Flex>
                ),
                reference: () => (
                    <Flex align='center' justify='center'>
                        <Button popup={visible.value} filtered={filtered.value} handleClick={toggle} />
                    </Flex>
                )
            }}
        />
    )
}, { props: ['time', 'focus', 'onChange'] })

export default RangeFilter