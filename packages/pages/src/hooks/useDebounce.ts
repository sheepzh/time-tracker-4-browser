import { shallowRef, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { useState } from './useState'

type FunctionArgs = (...args: any[]) => any

const DEFAULT_TIMEOUT = 100

export function useDebounceFn<T extends FunctionArgs>(
    fn: T,
    ms?: MaybeRefOrGetter<number>
): T {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const resolveDelay = (ms: MaybeRefOrGetter<number> | undefined): number => {
        if (typeof ms === 'function') {
            return ms()
        } else if (typeof ms === 'object' && 'value' in ms) {
            return ms.value
        } else if (typeof ms === 'number') {
            return ms
        } else {
            return DEFAULT_TIMEOUT
        }
    }

    const debounced = ((...args: Parameters<T>) => {
        timeoutId && clearTimeout(timeoutId)

        timeoutId = setTimeout(() => {
            fn(...args)
        }, resolveDelay(ms))
    }) as T

    return debounced
}

export function useDebounce<T>(original: Ref<T>, ms?: MaybeRefOrGetter<number>): Ref<T> {
    const inner = shallowRef<T>(original.value)

    const debouncedFn = useDebounceFn((newValue: T) => inner.value = newValue, ms)

    watch(original, newVal => debouncedFn(newVal))
    return inner
}

export function useDebounceState<T>(defaultValue: T, ms?: MaybeRefOrGetter<number>): [Ref<T>, ArgCallback<T>] {
    const [inner, setInner] = useState<T>(defaultValue)

    const debouncedSet = useDebounceFn(setInner, ms)

    return [inner, debouncedSet]
}