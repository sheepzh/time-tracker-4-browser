import { CircleClose, Clock } from "@element-plus/icons-vue"
import { useDebounceFn, useState, useXsState } from '@hooks'
import { durFmt } from '@i18n'
import { getStyle } from '@pages/util/style'
import { range } from "@util/array"
import { stopPropagationAfter } from '@util/document'
import {
    Effect, ElIcon, ElInput, ElMessage, ElPopover, ElScrollbar, InputProps,
    useLocale, useNamespace,
    type ScrollbarInstance, type TimePickerDefaultProps,
} from "element-plus"
import { computed, CSSProperties, defineComponent, nextTick, onMounted, ref, toRef, Transition, watch, type Ref } from "vue"

type TimeSpinnerProps = ModelValue<number> & {
    max: number
    visible: boolean
}

const TimeSpinner = defineComponent<TimeSpinnerProps>(props => {
    const ns = useNamespace('time')
    const scrollbar = ref<ScrollbarInstance>()
    const scrolling = ref(false)

    const debounceChangeValue = useDebounceFn((val: number) => {
        scrolling.value = false
        props.onChange?.(val)
    }, 200)

    const getScrollbarElement = () => {
        const el = scrollbar.value?.$el
        return el?.querySelector(`.${ns.namespace.value}-scrollbar__wrap`) as HTMLElement
    }

    const adjustSpinner = (value: number) => {
        const scrollbarEl = getScrollbarElement()
        if (!scrollbarEl) return

        scrollbarEl.scrollTop = Math.max(0, value * typeItemHeight())
    }

    watch(() => props.modelValue, () => adjustSpinner(props.modelValue))
    watch(() => props.visible, () => props.visible && nextTick(() => adjustSpinner(props.modelValue)))

    const typeItemHeight = (): number => {
        const listItem = scrollbar.value?.$el.querySelector('li')
        if (!(listItem instanceof HTMLElement)) return 0
        return Number.parseFloat(getStyle(listItem, 'height')) || 0
    }

    const bindScroll = () => {
        const scrollbarEl = getScrollbarElement()
        if (!scrollbarEl) return

        scrollbarEl.addEventListener('scroll', () => {
            scrolling.value = true
            const scrollTop = getScrollbarElement()?.scrollTop ?? 0
            const ulEl = scrollbar.value?.$el
            const scrollbarH = ulEl instanceof HTMLUListElement ? ulEl.offsetHeight : 0
            const itemH = typeItemHeight()
            const estimatedIdx = Math.round((scrollTop - (scrollbarH * 0.5 - 10) / itemH + 3) / itemH)
            const value = Math.min(estimatedIdx, props.max - 1)
            debounceChangeValue(value)
        }, { passive: true })
    }

    onMounted(() => {
        bindScroll()
        adjustSpinner(props.modelValue)
    })

    return () => (
        <ElScrollbar
            ref={scrollbar}
            class={ns.be('spinner', 'wrapper')}
            viewClass={ns.be('spinner', 'list')}
            noresize
            wrapStyle={{ maxHeight: 'inherit' }}
            tag="ul"
        >
            {range(props.max).map(idx => (
                <li
                    onClick={() => props.onChange?.(idx)}
                    class={[
                        ns.be('spinner', 'item'),
                        ns.is('active', idx === props.modelValue),
                    ]}
                >
                    {idx.toString().padStart(2, '0')}
                </li>
            ))}
        </ElScrollbar>
    )
}, { props: ['max', 'modelValue', 'visible', 'onChange'] })

const useTimeInput = (source: Ref<number | undefined>) => {
    const [hour, setHour] = useState(0)
    const [minute, setMinute] = useState(0)
    const [second, setSecond] = useState(0)

    const reset = () => {
        const secs = source.value ?? 0
        setHour(Math.floor(secs / 3600) % 24)
        setMinute(Math.floor(secs / 60) % 60)
        setSecond(secs % 60)
    }

    watch(source, reset, { immediate: true })

    return {
        hour, minute, second,
        setHour, setMinute, setSecond, reset,
    }
}

type TimeInputProps = Pick<TimePickerDefaultProps, 'size'> & ModelValue<number | undefined> & {
    hourMax?: number
    placeholder?: string
    style?: CSSProperties
    hideSeconds?: boolean
    width?: string
    clearable?: boolean
}

/**
 * Rewrite
 */
export default defineComponent<TimeInputProps>(props => {
    const [popoverVisible, setPopoverVisible] = useState(false)
    const {
        hour, minute, second, setHour, setMinute, setSecond, reset,
    } = useTimeInput(toRef(props, 'modelValue'))

    const clearable = computed(() => {
        const { clearable, placeholder } = props
        return clearable ?? !!placeholder
    })

    const inputAttr = computed<Pick<InputProps, 'modelValue' | 'clearable'>>(() => {
        const { modelValue, hideSeconds } = props
        // Not support 0 as valid time, treat it as unlimited
        if (!modelValue) return { modelValue: undefined, clearable: false }
        const text = durFmt().format({
            hours: hour.value,
            minutes: minute.value,
            seconds: hideSeconds ? undefined : second.value,
        })
        return { modelValue: text, clearable: clearable.value }
    })

    const ns = useNamespace('time')
    const nsDate = useNamespace('date')
    const nsInput = useNamespace('input')

    const { t: tEle } = useLocale()

    const transitionName = computed(() => popoverVisible.value ? '' : `${ns.namespace.value}-zoom-in-top`)

    const handleConfirm = () => {
        const value = hour.value * 3600 + minute.value * 60 + second.value
        if (!value && !clearable.value) {
            return ElMessage.warning(tEle('el.datepicker.selectTime'))
        }
        props.onChange?.(value)
        setPopoverVisible(false)
    }

    const handleVisibleChange = (newVal: boolean) => {
        setPopoverVisible(newVal)
        !newVal && reset()
    }

    const handleClear = (ev: MouseEvent) => stopPropagationAfter(ev, () => props.onChange?.(undefined))

    const isXs = useXsState()

    return () => (
        <ElPopover
            trigger='click'
            effect={Effect.LIGHT}
            visible={popoverVisible.value}
            transition={`${nsDate.namespace.value}-zoom-in-top`}
            popperClass={`${nsDate.namespace.value}-picker__popper`}
            onUpdate:visible={handleVisibleChange}
            v-slots={{
                reference: () => (
                    <ElInput
                        class={[nsDate.b('editor'), nsDate.bm('editor', 'time')]}
                        prefixIcon={Clock}
                        placeholder={props.placeholder}
                        modelValue={inputAttr.value.modelValue}
                        inputStyle={{ cursor: 'pointer' }}
                        style={{ ...props.style, '--el-date-editor-width': props.width ?? '170px' }}
                        size={props.size ?? (isXs.value ? 'small' : undefined)}
                        readonly
                        v-slots={{
                            suffix: () => inputAttr.value.clearable && (
                                <div onClick={handleClear}>
                                    <ElIcon class={[nsInput.e('icon'), 'clear-icon']}>
                                        <CircleClose />
                                    </ElIcon>
                                </div>
                            )
                        }}
                    />
                )
            }}>
            <Transition name={transitionName.value}>
                <div class={ns.b('panel')} style={{ width: '100%' }}>
                    <div class={[ns.be('panel', 'content'), !props.hideSeconds && 'has-seconds']}>
                        <div class={[ns.b('spinner'), !props.hideSeconds && 'has-seconds']}>
                            <TimeSpinner max={props.hourMax ?? 24} modelValue={hour.value} onChange={setHour} visible={popoverVisible.value} />
                            <TimeSpinner max={60} modelValue={minute.value} onChange={setMinute} visible={popoverVisible.value} />
                            {!props.hideSeconds && <TimeSpinner max={60} modelValue={second.value} onChange={setSecond} visible={popoverVisible.value} />}
                        </div>
                    </div>
                    <div class={[ns.be('panel', 'footer')]}>
                        <button
                            type="button"
                            class={[ns.be('panel', 'btn'), 'cancel']}
                            onClick={() => handleVisibleChange(false)}
                        >
                            {tEle('el.datepicker.cancel')}
                        </button>
                        <button
                            type="button"
                            class={[ns.be('panel', 'btn'), 'confirm']}
                            onClick={handleConfirm}
                        >
                            {tEle('el.datepicker.confirm')}
                        </button>
                    </div>
                </div>
            </Transition>
        </ElPopover>
    )
}, { props: ['style', 'size', 'placeholder', 'hourMax', 'modelValue', 'onChange', 'hideSeconds', 'width', 'clearable'] })