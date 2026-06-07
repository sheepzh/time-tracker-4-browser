import type { LimitReason } from '@cs/limit/types'
import { useProvide, useProvider } from '@hooks'
import type { ShallowRef } from 'vue'

type ContextValue = {
    reason: ShallowRef<LimitReason>
}

export const injectLimitReason = (reason: ShallowRef<LimitReason>) => {
    useProvide<ContextValue>('limit-reason', { reason })
}

export const useLimitReason = () => useProvider<ContextValue, 'reason'>('reason').reason