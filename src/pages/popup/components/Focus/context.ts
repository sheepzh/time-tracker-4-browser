import { focusAction, getCurrentSession, listFocusPresets } from '@api/sw/focus'
import { useLocalStorage, useManualRequest, usePermissionCheck, useProvide, useProvider, useRequest } from '@hooks'
import { t } from '@popup/locale'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    createArrayGuard, createObjectGuard, createStringUnionGuard, isOptionalBoolean, isOptionalInt, isString,
} from 'typescript-guard'
import { reactive, ref, toRaw, unref, watch, type Ref, type ShallowRef } from 'vue'

type FormData = Omit<tt4b.focus.Config, 'template'> & { presetId: number | undefined }
type FormDefault = MakeOptionalUndefined<FormData>
const TEMPLATE_DEFAULTS: Record<tt4b.focus.Template, FormDefault> = {
    focus: {
        mode: 'allow', cond: [], allowDelay: false,
        duration: 25 * 60, break: undefined, presetId: undefined,
    },
    pomodoro: {
        mode: 'block', cond: [], allowDelay: undefined,
        duration: 45 * 60, break: 10 * 60, presetId: undefined,
    },
}

type FocusContextValue = {
    session: ShallowRef<tt4b.focus.Session | undefined>
    refresh: NoArgCallback
    presets: ShallowRef<tt4b.focus.Preset[]>
    template: Ref<tt4b.focus.Template | undefined>
    form: FormData
    handleAction: (action: tt4b.focus.ActionRequest) => Promise<void>
    handleStart: () => Promise<void>
    applyPreset: ArgCallback<tt4b.focus.Preset>
    selectTemplate: ArgCallback<tt4b.focus.Template>
    resetTemplate: NoArgCallback
}

const NAMESPACE = 'focus'
const STORAGE_KEY = '__focus_form__'
const TPL_KEY = '__focus_tpl__'

const isTemplate = createStringUnionGuard<tt4b.focus.Template>('focus', 'pomodoro')
export const isMode = createStringUnionGuard<tt4b.focus.Mode>('allow', 'block')

const isFormData = createObjectGuard<FormData>({
    mode: isMode,
    cond: createArrayGuard(isString),
    duration: isOptionalInt,
    break: isOptionalInt,
    allowDelay: isOptionalBoolean,
    presetId: isOptionalInt,
})

export const initFocusContext = () => {
    const { data: session, refresh } = useRequest(getCurrentSession)
    const { data: presets } = useRequest(listFocusPresets, { defaultValue: [] })

    const [cachedTpl, setTplCache] = useLocalStorage<tt4b.focus.Template>(TPL_KEY, isTemplate)
    const template = ref(cachedTpl)

    const defaultForm = template.value ? TEMPLATE_DEFAULTS[template.value] : TEMPLATE_DEFAULTS.focus
    const [cached, setCache] = useLocalStorage<FormData>(STORAGE_KEY, isFormData, { ...defaultForm })
    const form = reactive<FormData>(cached)
    watch(() => form, () => setCache(toRaw(form)), { deep: true })

    const selectTemplate = (tpl: tt4b.focus.Template) => {
        template.value = tpl
        setTplCache(tpl)
        Object.assign(form, { ...TEMPLATE_DEFAULTS[tpl] })
    }

    const resetTemplate = () => {
        template.value = undefined
        setTplCache(undefined)
    }

    const { refreshAsync: handleAction } = useManualRequest(focusAction, { onSuccess: refresh })
    const { checkOrRequest } = usePermissionCheck('notifications')

    const handleStart = async () => {
        const tpl = template.value
        if (!tpl) return

        if (tpl === 'pomodoro' && (!form.duration || !form.break)) {
            return void ElMessage.error(t(msg => msg.shared.focus.noTime))
        }
        if (tpl === 'focus' && !form.cond.length) {
            if (form.mode === 'allow') {
                return void ElMessage.error(t(msg => msg.shared.focus.noAllowUrl))
            } else if (form.mode === 'block') {
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

        const config: tt4b.focus.Config = { template: tpl, ...unref(form) }
        await handleAction({ action: 'start', config, presetId: form.presetId })
    }

    const applyPreset = ({ mode, cond, duration, break: break_, template: t_, id }: tt4b.focus.Preset) => {
        if (t_ !== template.value) return
        form.mode = mode
        form.cond = [...cond]
        form.duration = duration
        form.break = break_
        form.presetId = id
    }

    useProvide<FocusContextValue>(NAMESPACE, {
        presets, applyPreset,
        session, refresh, form, handleAction, handleStart,
        template, selectTemplate, resetTemplate,
    })
}

export const useFocusSetup = () => useProvider<FocusContextValue, 'form' | 'handleStart' | 'template' | 'selectTemplate' | 'resetTemplate' | 'presets' | 'applyPreset'>(
    NAMESPACE, 'form', 'handleStart', 'template', 'selectTemplate', 'resetTemplate', 'presets', 'applyPreset',
)

export const useFocusContext = () => useProvider<FocusContextValue, 'session' | 'refresh' | 'handleAction'>(
    NAMESPACE, 'session', 'refresh', 'handleAction',
)