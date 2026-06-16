import { onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { useState } from './useState'

type FunctionArgs = (...args: any[]) => any

const DEFAULT_TIMEOUT = 100

export function useDebounceFn<T extends FunctionArgs>(
    fn: T,
    ms?: MaybeRefOrGetter<number>
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const clear = () => timeoutId && clearTimeout(timeoutId)

    const resolveDelay = (): number => toValue(ms ?? DEFAULT_TIMEOUT)

    const debounced = ((...args: Parameters<T>): void => {
        clear()
        timeoutId = setTimeout(() => fn(...args), resolveDelay())
    })

    onScopeDispose(clear)
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