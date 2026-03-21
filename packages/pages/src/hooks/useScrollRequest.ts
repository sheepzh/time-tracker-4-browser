import { onBeforeMount, ref, type Ref, watch, type WatchSource } from "vue"

type Option<T> = {
    manual?: boolean
    defaultValue?: T[]
    pageSize?: number
    resetDeps?: WatchSource<unknown> | WatchSource<unknown>[]
}

type Result<T> = {
    data: Ref<T[]>
    end: Ref<boolean>
    loading: Ref<boolean>
    loadMore: () => void
    loadMoreAsync: () => Promise<void>
    reset: () => void
}

export const useScrollRequest = <T>(getter: (pageNo: number, pageSize: number) => Promise<T[]>, option?: Option<T>): Result<T> => {
    const {
        defaultValue,
        manual,
        pageSize: outerPageSize,
        resetDeps,
    } = option || {}
    const data = ref<T[]>(defaultValue ?? []) as Ref<T[]>
    const end = ref(false)
    const loading = ref(false)
    const pageNo = ref(0)
    const pageSize = outerPageSize || 10

    const loadMoreAsync = async () => {
        if (end.value) return
        try {
            loading.value = true
            const no = pageNo.value = (pageNo.value + 1)
            const newData = await getter?.(no, pageSize) || []
            data.value = [...(data.value || []), ...(newData || [])]
            const newLen = newData?.length ?? 0
            if (!newLen || newLen < pageSize) {
                end.value = true
            }
        } finally {
            loading.value = false
        }
    }

    const reset = async () => {
        end.value = false
        pageNo.value = 0
        data.value = []
        await loadMoreAsync()
    }

    !manual && onBeforeMount(loadMoreAsync)

    if (resetDeps && (!Array.isArray(resetDeps) || resetDeps?.length)) {
        watch(resetDeps, reset)
    }

    return {
        data,
        end,
        loading,
        loadMore: () => loadMoreAsync(),
        loadMoreAsync,
        reset,
    }
}