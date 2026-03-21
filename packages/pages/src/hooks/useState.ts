import { type ShallowRef, shallowRef } from "vue"

export function useState<T>(defaultValue: T): [
    state: ShallowRef<T>,
    setter: (val: T) => void,
    reset: () => void,
]
export function useState<T>(defaultValue?: T): [
    state: ShallowRef<T | undefined>,
    setter: (val?: T) => void,
    reset: () => void,
]
export function useState<T>(defaultValue?: T):
    | [state: ShallowRef<T>, setter: (val: T) => void, reset: () => void]
    | [state: ShallowRef<T | undefined>, setter: (val?: T) => void, reset: () => void] {
    if (defaultValue === undefined || defaultValue === null) {
        const result = shallowRef<T>()
        return [
            result,
            (val?: T) => result.value = val,
            () => result.value = undefined
        ]
    } else {
        const result = shallowRef<T>(defaultValue)
        return [
            result,
            (val: T) => result.value = val,
            () => result.value = defaultValue
        ]
    }
}