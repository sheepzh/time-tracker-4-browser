import { t } from '@app/locale'
import { useManualRequest, useProvide, useProvider } from "@hooks"
import { mergeObject } from '@util/lang'
import { ElMessage } from "element-plus"
import { computed, nextTick, Reactive, reactive, ref, ShallowRef, type Ref } from "vue"

type DialogSopContext<TForm extends Record<string, unknown>> = {
    visible: ShallowRef<boolean>
    step: Ref<number>
    form: Reactive<TForm>
    isFirst: ShallowRef<boolean>
    isLast: ShallowRef<boolean>
    doNext: NoArgCallback
    nextLoading: ShallowRef<boolean>
    doPrevious: NoArgCallback
    hide: NoArgCallback
}

const NAMESPACE = "dialogSop"

type TransmitParam<TForm extends Record<string, unknown>> = {
    form: Reactive<TForm>
    current: number
    target: number
}

export type DialogSopInitOptions<TForm extends Record<string, unknown>> = {
    stepCount: number
    init: () => TForm
    onNext?: (p: TransmitParam<TForm>) => Awaitable<void>
    onFinish?: (p: Omit<TransmitParam<TForm>, 'target'>) => Awaitable<void>
    onBack?: (p: TransmitParam<TForm>) => Awaitable<void>
}

export function initDialogSopContext<TForm extends Record<string, unknown>>(options: DialogSopInitOptions<TForm>) {
    const {
        stepCount,
        init, onNext, onFinish, onBack,
    } = options
    if (!Number.isInteger(stepCount) || stepCount < 1) throw new Error("Invalid step count, must be positive integer")
    const lastIdx = stepCount - 1

    const visible = ref(false)
    const step = ref(0)
    const isLast = computed(() => step.value === lastIdx)
    const isFirst = computed(() => step.value === 0)
    const form = reactive<TForm>(init())
    const hide = () => visible.value = false
    const open = (val?: TForm) => {
        visible.value = true
        step.value = 0
        nextTick(() => mergeObject(form as TForm, val ?? init()))
    }

    const { loading: nextLoading, refresh: doNext } = useManualRequest(async () => {
        const current = step.value
        if (isLast.value) {
            await onFinish?.({ form, current })
            visible.value = false
            ElMessage.success(t(msg => msg.operation.successMsg))
        } else {
            const target = current + 1
            await onNext?.({ form, current, target })
            step.value = target
        }
    }, {
        onError: e => ElMessage.error(e instanceof Error ? e.message : String(e)),
    })

    const doPrevious = async () => {
        if (isFirst.value) {
            hide()
        } else {
            try {
                const current = step.value
                const target = current - 1
                await onBack?.({ current, target, form })
                step.value = target
            } catch (e) {
                ElMessage.warning(e instanceof Error ? e.message : String(e))
            }
        }
    }

    useProvide<DialogSopContext<TForm>>(NAMESPACE, {
        visible, form, isFirst, isLast,
        step, doNext, doPrevious, nextLoading, hide
    })

    return { open, step, form }
}

export const useDialogSop = <TForm extends Record<string, unknown>>() => useProvider<
    DialogSopContext<TForm>,
    'form' | 'isLast' | 'isFirst' | 'step' | 'doPrevious' | 'doNext' | 'nextLoading' | 'hide' | 'visible'
>(
    NAMESPACE, 'form', 'doPrevious', 'doNext', 'isFirst', 'isLast', 'step', 'nextLoading', 'hide', 'visible'
)