import { getUsedStorage, type MemoryInfo } from "@db/memory-detector"
import { useProvide, useProvider, useRequest } from "@hooks"
import { type Ref } from "vue"

type Context = {
    memory: Ref<MemoryInfo>
    refreshMemory: () => void
}

const NAMESPACE = 'dataManage'

export const initDataManage = () => {
    const { data: memory, refresh: refreshMemory } = useRequest(getUsedStorage, { defaultValue: { used: 0, total: 1 } })
    useProvide<Context>(NAMESPACE, { memory, refreshMemory })
}

export const useDataMemory = () => useProvider<Context, 'memory' | 'refreshMemory'>(NAMESPACE, 'refreshMemory', 'memory')