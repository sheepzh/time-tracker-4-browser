import type { Ref, WatchSource } from "vue"
import type { RequestOption, RequestResult } from "./useRequest"

export declare function useState<T>(defaultValue: T): [state: Ref<T>, setter: (val: T) => void, reset: () => void]
export declare function useState<T>(defaultValue?: T): [state: Ref<T | undefined>, setter: (val?: T) => void, reset: () => void]

export declare function useShadow<T>(source: WatchSource<T>): [Ref<T>, setter: (val: T) => void, refresh: () => void]
export declare function useShadow<T>(source: WatchSource<T>, defaultValue: T): [Ref<T>, setter: (val: T) => void, refresh: () => void]
export declare function useShadow<T>(source: WatchSource<T>, defaultValue?: T): [Ref<T | undefined>, setter: (val?: T) => void, refresh: () => void]

export declare function useManualRequest<P extends any[], T>(
    getter: (...p: P) => Awaitable<T>,
    option: MakeRequired<Omit<RequestOption<T, P>, 'manual'>, 'defaultValue'>,
): RequestResult<T, P>
export declare function useManualRequest<P extends any[], T>(
    getter: (...p: P) => Awaitable<T | undefined>,
    option?: Omit<RequestOption<T, P>, 'manual'>,
): RequestResult<T | undefined, P>

export declare function useRequest<P extends any[], T>(
    getter: (...p: P) => Awaitable<T>,
    option: MakeRequired<RequestOption<T, P>, 'defaultValue'>,
): RequestResult<T, P>
export declare function useRequest<P extends any[], T>(
    getter: (...p: P) => Awaitable<T | undefined>,
    option?: RequestOption<T, P>,
): RequestResult<T | undefined, P>


export declare function useCached<T>(key: string, defaultValue: T, defaultFirst?: boolean): { data: Ref<T>, setter: (val: T) => void }
export declare function useCached<T>(
    key: string | undefined,
    defaultValue?: T,
    defaultFirst?: boolean,
): { data: Ref<T | undefined>, setter: (val: T | undefined) => void }

export declare function useLocalStorage<T>(key: string, defaultValue: T): [T, (val: T | undefined) => void]
export declare function useLocalStorage<T>(key: string): [T, (val: T | undefined) => void]

export * from "./useCached"
export * from "./useLocalStorage"
export * from "./useMediaSize"
export * from "./useProvider"
export * from "./useRequest"
export * from "./useShadow"
export * from "./useState"
export * from "./useSwitch"

