import { sendMsg2Runtime } from '@api/sw/common'
import { useProvide, useProvider, useRequest } from '@hooks'
import { type ShallowRef } from "vue"

type Context = {
    memory: ShallowRef<timer.common.StorageUsage>
    refreshMemory: () => void
}

const NAMESPACE = 'dataManage'

export const initDataManage = () => {
    const { data: memory, refresh: refreshMemory } = useRequest(
        () => sendMsg2Runtime('meta.usedStorage'),
        { defaultValue: { used: 0, total: 1 } },
    )
    useProvide<Context>(NAMESPACE, { memory, refreshMemory })
}

export const useDataMemory = () => useProvider<Context, 'memory' | 'refreshMemory'>(NAMESPACE, 'refreshMemory', 'memory')