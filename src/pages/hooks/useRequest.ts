import { ElLoadingService } from "element-plus"
import { onBeforeMount, onMounted, ref, watch, type Ref, type WatchSource } from "vue"

export type RequestOption<T, P extends any[]> = {
    manual?: boolean
    defaultValue?: T
    loadingTarget?: string | Ref<HTMLElement | undefined>
    loadingText?: string
    defaultParam?: P
    deps?: WatchSource<unknown> | WatchSource<unknown>[]
    onSuccess?: (result: T) => void,
    onError?: (e: unknown) => void
}

export type RequestResult<T, P extends any[]> = {
    data: Ref<T>
    ts: Ref<number>
    refresh: (...p: P) => void
    refreshAsync: (...p: P) => Promise<void>
    refreshAgain: () => void
    loading: Ref<boolean>
    param: Ref<P | undefined>
}

export const useRequest = <P extends any[], T>(getter: (...p: P) => Promise<T> | T, option?: RequestOption<T, P>): RequestResult<T, P> => {
    const {
        manual = false,
        defaultValue, defaultParam = ([] as any[] as P),
        loadingTarget, loadingText,
        deps,
        onSuccess, onError,
    } = option || {}
    const data = ref(defaultValue) as Ref<T>
    const loading = ref(false)
    const param = ref<P>()
    const ts = ref<number>(Date.now())

    const refreshAsync = async (...p: P) => {
        loading.value = true
        const loadingEl = typeof loadingTarget === "string" ? loadingTarget : loadingTarget?.value
        const loadingInstance = loadingEl ? ElLoadingService({ target: loadingEl, text: loadingText }) : null
        try {
            param.value = p
            const value = await getter?.(...p)
            data.value = value
            ts.value = Date.now()
            onSuccess?.(value)
        } catch (e) {
            console.warn("Errored when requesting", e)
            onError?.(e)
        } finally {
            loading.value = false
            loadingInstance?.close?.()
        }
    }
    const refresh = (...p: P) => { refreshAsync(...p) }
    if (!manual) {
        // If loading target specified, do first query after mounted
        const hook = loadingTarget ? onMounted : onBeforeMount
        hook(() => refresh(...defaultParam))
    }
    if (deps && (!Array.isArray(deps) || deps?.length)) {
        watch(deps, () => refresh(...defaultParam))
    }
    const refreshAgain = () => param.value && refresh(...param.value)
    return { data, ts, refresh, refreshAsync, refreshAgain, loading, param }
}

export const useManualRequest = <P extends any[], T>(getter: (...p: P) => Promise<T> | T, option?: Omit<RequestOption<T, P>, 'manual'>): RequestResult<T, P> => {
    return useRequest(getter, { ...option || {}, manual: true })
}