import { ref, type Ref, watch, type WatchSource } from "vue"
import { useRequest } from './useRequest'

type Option = {
    pageSize?: number
    resetDeps?: WatchSource<unknown> | WatchSource<unknown>[]
}

type Result<T> = {
    data: Ref<T[]>
    end: Ref<boolean>
    loading: Ref<boolean>
    loadMore: () => Promise<void>
    reset: NoArgCallback
}

export const useScrollRequest = <T>(getter: (pageNo: number, pageSize: number) => Promise<T[]>, option?: Option): Result<T> => {
    const { pageSize = 10, resetDeps } = option ?? {}
    const end = ref(false)
    const queriedPage = ref(0)
    const data: Ref<T[]> = ref([])

    const { refreshAsync, loading } = useRequest(
        (pageNo: number) => getter(pageNo, pageSize),
        {
            defaultParam: [1],
            onSuccess: (list, pageNo) => {
                list.length && (data.value = [...data.value, ...list])
                end.value = list.length < pageSize
                list.length && (queriedPage.value = pageNo)
            },
        },
    )

    const loadMore = async () => {
        if (loading.value || end.value) return
        return refreshAsync(queriedPage.value + 1)
    }

    const reset = async () => {
        if (loading.value) return
        end.value = false
        data.value = []
        queriedPage.value = 0
        await refreshAsync(1)
    }

    resetDeps && watch(resetDeps, reset)

    return { data, end, loading, loadMore, reset }
}