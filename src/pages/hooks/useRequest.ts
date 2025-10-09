import { ElLoadingService } from "element-plus"
import {
    onBeforeMount, onMounted, ref, shallowRef, watch,
    type Ref, type ShallowRef, type WatchSource,
} from "vue"

export type RequestOption<T, P extends any[]> = {
    manual?: boolean
    defaultValue?: T
    loadingTarget?: string | Ref<HTMLElement | undefined> | Getter<HTMLElement | undefined>
    loadingText?: string
    defaultParam?: P
    deps?: WatchSource<unknown> | WatchSource<unknown>[]
    onSuccess?: (result: T) => void,
    onError?: (e: unknown) => void
}

export type RequestResult<T, P extends any[]> = {
    data: ShallowRef<T>
    ts: ShallowRef<number>
    refresh: (...p: P) => void
    refreshAsync: (...p: P) => Promise<void>
    refreshAgain: () => void
    loading: ShallowRef<boolean>
    param: ShallowRef<P | undefined>
}

const findLoadingEl = async (target: RequestOption<unknown, unknown[]>['loadingTarget']): Promise<string | HTMLElement | undefined> => {
    if (!target) return undefined
    if (typeof target === 'string') {
        return target
    } else if (typeof target === 'function') {
        const res = await target?.()
        if (res instanceof HTMLElement) {
            return res
        }
    } else {
        return target.value
    }
    return undefined
}

export function useRequest<P extends any[], T>(
    getter: (...p: P) => Awaitable<T>,
    option: MakeRequired<RequestOption<T, P>, 'defaultValue'>,
): RequestResult<T, P>
export function useRequest<P extends any[], T>(
    getter: (...p: P) => Awaitable<T | undefined>,
    option?: RequestOption<T, P>,
): RequestResult<T | undefined, P>

export function useRequest<P extends any[], T>(
    getter: (...p: P) => Promise<T> | T,
    option?: RequestOption<T, P>,
): RequestResult<T, P> {
    const {
        manual = false,
        defaultValue, defaultParam = ([] as any[] as P),
        loadingTarget, loadingText,
        deps,
        onSuccess, onError,
    } = option || {}
    const data = shallowRef(defaultValue) as ShallowRef<T>
    const loading = ref(false)
    const param = ref<P>()
    const ts = ref<number>(Date.now())

    const refreshAsync = async (...p: P) => {
        loading.value = true
        let loadingEl = await findLoadingEl(loadingTarget)
        // fallback use document
        !loadingEl && loadingText && (loadingEl = document.body)
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
        watch(deps, () => refresh(...defaultParam), { deep: true })
    }
    const refreshAgain = () => param.value && refresh(...param.value)
    return { data, ts, refresh, refreshAsync, refreshAgain, loading, param }
}