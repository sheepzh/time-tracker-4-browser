import { type Ref, type WatchSource, ref, watch } from "vue"

export function useShadow<T>(source: WatchSource<T>): [Ref<T>, setter: (val: T) => void, refresh: () => void]
export function useShadow<T>(source: WatchSource<T>, defaultValue: T): [Ref<T>, setter: (val: T) => void, refresh: () => void]
export function useShadow<T>(source: WatchSource<T>, defaultValue?: T): [Ref<T | undefined>, setter: (val?: T) => void, refresh: () => void]
export function useShadow<T>(source: WatchSource<T>, defaultValue?: T): [Ref<T | undefined>, setter: (val?: T) => void, refresh: () => void] {
    const getVal = () => typeof source === "function" ? source() : source?.value
    const initial = getVal() ?? defaultValue
    const shadow = initial ? ref<T>(initial) : ref<T>()
    watch(source, () => shadow.value = getVal())
    return [shadow as Ref<T | undefined>, (val?: T) => shadow.value = val, () => shadow.value = getVal()]
}