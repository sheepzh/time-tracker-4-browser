import { getLimitSummary } from '@api/sw/limit'
import { useProvide, useProvider, useRequest } from '@hooks'
import { ref, type ShallowRef } from 'vue'

type LimitContext = {
    summary: ShallowRef<tt4b.limit.Summary | undefined>
    loading: ShallowRef<boolean>
    selected: ShallowRef<number | undefined>
}

const NAMESPACE = 'limit'

export const initLimitContext = () => {
    const selected = ref<number>()
    const { data: summary, loading } = useRequest(getLimitSummary, {
        onSuccess(newVal) {
            const newItems = newVal.items
            if (!newItems.some(i => i.id === selected.value)) {
                selected.value = newItems[0]?.id
            }
        }
    })
    useProvide<LimitContext>(NAMESPACE, { summary, loading, selected })
}

export const useLimitContext = () => useProvider<LimitContext, 'summary' | 'loading' | 'selected'>(NAMESPACE, 'summary', 'loading', 'selected')
