import { useProvide, useProvider, useRequest } from '@hooks'
import { getUsedStorage, type MemoryInfo } from "@api/sw/memory"
import { type Ref } from "vue"

type Context = {
    memory: Ref<MemoryInfo>
    refreshMemory: () => void
}

const NAMESPACE = 'dataManage'

export const initDataManage = () => {
    const { data: memory, refresh: refreshMemory } = useRequest(() => getUsedStorage(), { defaultValue: { used: 0, total: 1 } })
    useProvide<Context>(NAMESPACE, { memory: memory as Ref<MemoryInfo>, refreshMemory })
}

export const useDataMemory = () => useProvider<Context, 'memory' | 'refreshMemory'>(NAMESPACE, 'refreshMemory', 'memory')