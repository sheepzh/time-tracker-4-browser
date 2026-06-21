import { deleteFocusPreset, getCurrentSession, listFocusPresets } from '@api/sw/focus'
import { t } from '@app/locale'
import { type FocusQuery } from '@app/router/constants'
import { useManualRequest, useProvide, useProvider, useRequest } from '@hooks'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref, type ShallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type ContextValue = {
    presets: ShallowRef<tt4b.focus.Preset[]>
    loading: ShallowRef<boolean>
    session: ShallowRef<tt4b.focus.Session | undefined>
    refresh: NoArgCallback
    remove: ArgCallback<tt4b.focus.Preset>
    modifyInst: ShallowRef<ModifyInstance | undefined>
}

export type ModifyInstance = {
    create: NoArgCallback
    modify: ArgCallback<tt4b.focus.Preset>
}

const NAMESPACE = 'focus-preset'

const parseQuery = (): FocusQuery['action'] => {
    const router = useRouter()
    const { action } = useRoute().query as FocusQuery
    router.replace({ query: {} })
    return action
}

export const initFocusManage = () => {
    const action = parseQuery()

    const { data: presets, refresh, loading } = useRequest(listFocusPresets, { defaultValue: [] })
    const { data: session } = useRequest(getCurrentSession)

    const modifyInst = ref<ModifyInstance>()

    const { refresh: remove } = useManualRequest(async (preset: tt4b.focus.Preset) => {
        const msg = t(msg => msg.focus.deleteConfirm, { name: preset.name })
        await ElMessageBox.confirm(msg, t(msg => msg.button.delete), { type: 'warning' })
        await deleteFocusPreset(preset.id)
    }, {
        onSuccess() {
            ElMessage.success(t(msg => msg.operation.successMsg))
            refresh()
        }
    })

    if (action === 'create') {
        onMounted(() => setTimeout(() => modifyInst.value?.create()))
    }

    useProvide<ContextValue>(NAMESPACE, { presets, session, refresh, remove, modifyInst, loading })

    return { modifyInst }
}

export const useFocusList = () => useProvider<ContextValue, 'presets' | 'refresh' | 'session' | 'remove' | 'modifyInst' | 'loading'>(
    NAMESPACE, 'presets', 'refresh', 'session', 'remove', 'modifyInst', 'loading'
)