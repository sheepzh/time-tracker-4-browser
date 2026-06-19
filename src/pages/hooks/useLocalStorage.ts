import type { TypeGuard } from 'typescript-guard'
import { reactive, type Reactive, shallowRef, type ShallowRef, toRaw, watch } from 'vue'

type StorageValue =
    | string | number | boolean | undefined
    | StorageValue[]
    | StorageObject
type StorageObject = { [key: string]: StorageValue }

function deserialize<T>(json: string | null, guard: TypeGuard<T>): T | undefined {
    if (!json) return undefined

    try {
        const parsed = JSON.parse(json)
        return guard(parsed) ? parsed : undefined
    } catch {
        return undefined
    }
}

export function localRef<T>(key: string, guard: TypeGuard<T>, defaultValue: T): ShallowRef<T>
export function localRef<T>(key: string, guard: TypeGuard<T>): ShallowRef<T | undefined>
export function localRef<T>(key: string, guard: TypeGuard<T>, defaultValue?: T): ShallowRef<T | undefined> {
    const result = shallowRef<T | undefined>(deserialize(localStorage.getItem(key), guard) ?? defaultValue)
    watch(result, val => val === undefined
        ? localStorage.removeItem(key)
        : localStorage.setItem(key, JSON.stringify(val))
    )
    return result
}

export function localReactive<T extends StorageObject>(key: string, guard: TypeGuard<T>, defaultValue: T): Reactive<T> {
    const result = reactive(deserialize(localStorage.getItem(key), guard) ?? defaultValue)
    watch(result,
        val => localStorage.setItem(key, JSON.stringify(toRaw(val))),
        { deep: true },
    )
    return result
}
