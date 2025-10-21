import { shallowRef, watch, type MaybeRefOrGetter, type Ref } from 'vue'

type FunctionArgs = (...args: any[]) => any

const DEFAULT_TIMEOUT = 200

export function useDebounceFn<T extends FunctionArgs>(
    fn: T,
    ms?: MaybeRefOrGetter<number>
): T {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const resolveValue = (value: MaybeRefOrGetter<number>): number => {
        if (typeof value === 'function') {
            return value()
        } else if (value && typeof value === 'object' && 'value' in value) {
            return value.value
        }
        return value
    }

    const debounced = ((...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        const delay = ms !== undefined ? resolveValue(ms) : DEFAULT_TIMEOUT

        timeoutId = setTimeout(() => {
            fn(...args)
        }, delay)
    }) as T

    return debounced
}

export function useDebounce<T>(original: Ref<T>, ms?: MaybeRefOrGetter<number>): Ref<T> {
    const inner = shallowRef<T>(original.value)

    const debouncedFn = useDebounceFn((newValue: T) => inner.value = newValue, ms)

    watch(original, newVal => debouncedFn(newVal))
    return inner
}