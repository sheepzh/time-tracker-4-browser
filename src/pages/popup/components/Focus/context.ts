import { focusAction, getCurrentSession, listFocusPresets } from '@api/sw/focus'
import { localReactive, localRef, useManualRequest, usePermissionCheck, useProvide, useProvider, useRequest } from '@hooks'
import { FOCUS_METHOD_DEFAULTS } from '@pages/util/focus'
import { t } from '@popup/locale'
import { isMethod, isPolicy } from '@util/focus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    createArrayGuard, createObjectGuard,
    isOptionalBoolean, isOptionalInt, isString
} from 'typescript-guard'
import { toRaw, type Ref, type ShallowRef } from 'vue'

type FormData = Omit<tt4b.focus.Config, 'method'> & { presetId: number | undefined }

type ContextValue = {
    session: ShallowRef<tt4b.focus.Session | undefined>
    refresh: NoArgCallback
    presets: ShallowRef<tt4b.focus.Preset[]>
    method: Ref<tt4b.focus.Method | undefined>
    form: FormData
    handleAction: (action: tt4b.focus.ActionRequest) => Promise<void>
    handleStart: () => Promise<void>
    apply: ArgCallback<tt4b.focus.Preset | tt4b.focus.Method>
}

const NAMESPACE = 'focus'

const isFormData = createObjectGuard<FormData>({
    policy: isPolicy,
    cond: createArrayGuard(isString),
    duration: isOptionalInt,
    break: isOptionalInt,
    allowDelay: isOptionalBoolean,
    presetId: isOptionalInt,
})

function initSetup() {
    const method = localRef('__focus_method__', isMethod)
    const defaultForm = FOCUS_METHOD_DEFAULTS[method.value ?? 'focus']
    const form = localReactive('__focus_form__', isFormData, {
        ...defaultForm,
        presetId: undefined,
    })

    const applyForm = (config: Omit<tt4b.focus.Config, 'method'>, presetId: number | undefined) => {
        form.policy = config.policy
        form.cond = [...config.cond]
        form.duration = config.duration
        form.break = config.break
        form.allowDelay = config.allowDelay
        form.presetId = presetId
    }

    const apply: ContextValue['apply'] = val => {
        if (typeof val === 'string') {
            method.value = val
            applyForm(FOCUS_METHOD_DEFAULTS[val], undefined)
        } else {
            const { method: newMethod, id: presetId, ...form } = val
            method.value = newMethod
            applyForm(form, presetId)
        }
    }
    return { method, form, apply }
}

export const initFocusContext = () => {
    const { data: session, refresh } = useRequest(getCurrentSession)
    const { data: presets } = useRequest(listFocusPresets, { defaultValue: [] })
    const { method, form, apply } = initSetup()

    const { refreshAsync: handleAction } = useManualRequest(focusAction, { onSuccess: refresh })
    const { checkOrRequest } = usePermissionCheck('notifications')

    const handleStart = async () => {
        const m = method.value
        if (!m) return

        if (m === 'pomodoro' && (!form.duration || !form.break)) {
            return void ElMessage.error(t(msg => msg.shared.focus.noTime))
        }
        if (m === 'focus' && !form.cond.length) {
            if (form.policy === 'allow') {
                return void ElMessage.error(t(msg => msg.shared.focus.noAllowUrl))
            } else if (form.policy === 'block') {
                const data = await ElMessageBox.confirm(
                    t(msg => msg.shared.focus.noBlockUrl),
                    { type: 'warning' },
                )
                const confirmed = data === 'confirm' || data.action === 'confirm'
                if (!confirmed) return
            }
        }

        const hasPerm = await checkOrRequest()
        if (!hasPerm) return

        const config: tt4b.focus.Config = { method: m, ...toRaw(form) }
        await handleAction({ action: 'start', config, presetId: form.presetId })
    }

    useProvide<ContextValue>(NAMESPACE, {
        presets, method, form, session,
        apply, refresh,
        handleAction, handleStart,
    })

    return { session, method }
}

export const useFocusSetup = () => useProvider<ContextValue, 'form' | 'handleStart' | 'method' | 'presets' | 'apply'>(
    NAMESPACE, 'form', 'handleStart', 'method', 'presets', 'apply',
)

export const useFocusContext = () => useProvider<ContextValue, 'session' | 'refresh' | 'handleAction'>(
    NAMESPACE, 'session', 'refresh', 'handleAction',
)