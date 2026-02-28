import { CircleClose, Clock } from "@element-plus/icons-vue"
import { useDebounceFn, useState, useXsState } from "@hooks"
import { getStyle } from "@pages/util/style"
import { range } from "@util/array"
import {
    Effect, ElIcon, ElInput, ElPopover, ElScrollbar,
    type ScrollbarInstance,
    useLocale, useNamespace
} from "element-plus"
import { computed, defineComponent, nextTick, onMounted, ref, Transition, watch } from "vue"

function computeSecond2LimitInfo(time: number): [number, number, number] {
    time = time || 0
    const second = time % 60
    const totalMinutes = (time - second) / 60
    const minute = totalMinutes % 60
    const hour = (totalMinutes - minute) / 60
    return [hour, minute, second]
}

const formatTimeVal = (val: number): string => {
    return val?.toString?.()?.padStart?.(2, '0') ?? 'NaN'
}

type TimeSpinnerProps = {
    max: number
    modelValue: number
    visible: boolean
    onChange?: (val: number) => void
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
        let scrollbarEl = getScrollbarElement()
        if (!scrollbarEl) return

        scrollbarEl.scrollTop = Math.max(0, value * typeItemHeight())
    }

    watch(() => props.modelValue, () => adjustSpinner(props.modelValue))
    watch(() => props.visible, () => props.visible && nextTick(() => adjustSpinner(props.modelValue)))

    const typeItemHeight = (): number => {
        const listItem = scrollbar.value?.$el.querySelector('li') as HTMLLinkElement
        if (listItem) {
            return Number.parseFloat(getStyle(listItem, 'height')) || 0
        }
        return 0
    }

    const bindScroll = () => {
        let scrollbarEl = getScrollbarElement()
        if (!scrollbarEl) return

        scrollbarEl.addEventListener('scroll', () => {
            scrolling.value = true
            const scrollTop = getScrollbarElement()?.scrollTop ?? 0
            const scrollbarH = (scrollbar.value?.$el as HTMLUListElement)!.offsetHeight ?? 0
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

const useTimeInput = (source: () => number) => {
    const [initialHour, initialMin, initialSec] = computeSecond2LimitInfo(source?.() ?? 0)
    const [hour, setHour] = useState(initialHour)
    const [minute, setMinute] = useState(initialMin)
    const [second, setSecond] = useState(initialSec)

    const reset = () => {
        const [hour, min, sec] = computeSecond2LimitInfo(source?.() ?? 0)
        setHour(hour)
        setMinute(min)
        setSecond(sec)
    }

    watch(source, reset)

    const getTotalSecond = () => {
        let time = 0
        time += (hour.value ?? 0) * 3600
        time += (minute.value ?? 0) * 60
        time += (second.value ?? 0)
        return time
    }

    return {
        hour, minute, second,
        setHour, setMinute, setSecond,
        reset, getTotalSecond,
    }
}

type TimeInputProps = {
    modelValue: number
    hourMax?: number
    onChange?: (val: number) => void
}

/**
 * Rewrite
 *
 * https://github.com/element-plus/element-plus/blob/dev/packages/components/time-picker/src/time-picker-com/panel-time-pick.vue
 */
const TimeInput = defineComponent<TimeInputProps>(props => {
    const [popoverVisible, setPopoverVisible] = useState(false)
    const {
        hour, minute, second,
        setHour, setMinute, setSecond,
        reset, getTotalSecond,
    } = useTimeInput(() => props.modelValue)

    const inputText = computed(() => `${formatTimeVal(hour.value)} h ${formatTimeVal(minute.value)} m ${formatTimeVal(second.value)} s`)

    const ns = useNamespace('time')
    const nsDate = useNamespace('date')
    const nsInput = useNamespace('input')

    const { t: tEle } = useLocale()

    const transitionName = computed(() => popoverVisible.value ? '' : `${ns.namespace.value}-zoom-in-top`)

    const handleCancel = () => {
        reset()
        setPopoverVisible(false)
    }

    const handleConfirm = () => {
        props.onChange?.(getTotalSecond())
        setPopoverVisible(false)
    }

    const handleVisibleChange = (newVal: boolean) => {
        setPopoverVisible(newVal)
        !newVal && handleCancel()
    }

    const handleClear = (ev: MouseEvent) => {
        props.onChange?.(0)
        ev.stopPropagation()
    }

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
                        modelValue={inputText.value}
                        inputStyle={{ cursor: 'pointer' }}
                        style={{ '--el-date-editor-width': '160px' }}
                        size={isXs.value ? 'small' : undefined}
                        readonly
                        v-slots={{
                            suffix: () => !!props.modelValue && (
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
                    <div class={[ns.be('panel', 'content'), 'has-seconds']}>
                        <div class={[ns.b('spinner'), 'has-seconds']}>
                            <TimeSpinner max={props.hourMax ?? 24} modelValue={hour.value} onChange={setHour} visible={popoverVisible.value} />
                            <TimeSpinner max={60} modelValue={minute.value} onChange={setMinute} visible={popoverVisible.value} />
                            <TimeSpinner max={60} modelValue={second.value} onChange={setSecond} visible={popoverVisible.value} />
                        </div>
                    </div>
                    <div class={[ns.be('panel', 'footer')]}>
                        <button
                            type="button"
                            class={[ns.be('panel', 'btn'), 'cancel']}
                            onClick={handleCancel}
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
}, { props: ['hourMax', 'modelValue', 'onChange'] })

export default TimeInput