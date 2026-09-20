import { checkAuth } from '@api/sw/backup'
import { ref, type Ref } from 'vue'
import { useProvide, useProvider } from './useProvider'
import { useRequest } from './useRequest'

const NAMESPACE = '__remote_enabled__'

type Value = {
    remote: Ref<boolean>
    available: Readonly<Ref<boolean>>
    refresh: NoArgCallback
}

export const initRemote = () => {
    const remote = ref(false)
    const { data: available, refresh } = useRequest(() => checkAuth().then(errMsg => !errMsg), {
        defaultValue: false,
        onSuccess: v => !v && (remote.value = v)
    })
    useProvide<Value>(NAMESPACE, { remote, available, refresh })
}

export const useRemote = () => useProvider<Value, 'remote' | 'available' | 'refresh'>(
    NAMESPACE, 'remote', 'available', 'refresh',
)

export const useRemoteValue = () => useProvider<Value, 'remote'>(NAMESPACE, 'remote').remote