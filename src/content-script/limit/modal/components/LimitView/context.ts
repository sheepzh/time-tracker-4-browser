import type { LimitReason } from '@cs/limit/types'
import { useProvide, useProvider } from '@hooks'
import type { ShallowRef } from 'vue'

type ContextValue = {
    reason: ShallowRef<LimitReason>
}

const NAMESPACE = 'limit-reason'

export const injectLimitReason = (reason: ShallowRef<LimitReason>) => {
    useProvide<ContextValue>(NAMESPACE, { reason })
}

export const useLimitReason = () => useProvider<ContextValue, 'reason'>(NAMESPACE, 'reason').reason