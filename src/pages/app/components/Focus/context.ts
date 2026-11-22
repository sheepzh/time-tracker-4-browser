import { deleteFocusPreset, getCurrentSession, listFocusPresets } from '@api/sw/focus'
import { type FocusQuery } from '@app/router/constants'
import { useOperation, useProvide, useProvider, useRequest } from '@hooks'
import { queryStr, type MakeRouteQuery } from '@pages/util/route'
import { onMounted, ref, type ShallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type ContextValue = {
    presets: ShallowRef<tt4b.focus.Preset[]>
    session: ShallowRef<tt4b.focus.Session | undefined>
    refresh: NoArgCallback
    remove: ArgCallback<number>
    modifyInst: ShallowRef<ModifyInstance | undefined>
}

export type ModifyInstance = {
    create: NoArgCallback
    modify: ArgCallback<tt4b.focus.Preset>
}

const NAMESPACE = 'focus-preset'

const parseQuery = (): string | undefined => {
    const { action }: MakeRouteQuery<FocusQuery> = useRoute().query
    useRouter().replace({ query: {} })
    return queryStr(action)
}

export const initFocusManage = () => {
    const action = parseQuery()

    const { data: presets, refresh } = useRequest(listFocusPresets, { defaultValue: [] })
    const { data: session } = useRequest(getCurrentSession)

    const modifyInst = ref<ModifyInstance>()

    const remove = useOperation(deleteFocusPreset, { onSuccess: refresh })

    if (action === 'create') {
        onMounted(() => setTimeout(() => modifyInst.value?.create()))
    }

    useProvide<ContextValue>(NAMESPACE, { presets, session, refresh, remove, modifyInst })

    return { modifyInst }
}

export const useFocusList = () => useProvider<ContextValue, 'presets' | 'refresh' | 'session' | 'remove' | 'modifyInst'>(
    NAMESPACE, 'presets', 'refresh', 'session', 'remove', 'modifyInst'
)