import type { TypeGuard } from 'typescript-guard'
import { reactive, type Reactive, shallowRef, type ShallowRef, toRaw, toRefs, watch } from 'vue'

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

export function localReactive<T extends StorageObject, StoreKeys extends keyof T>(
    key: string,
    guard: TypeGuard<Pick<T, StoreKeys>>,
    defaultValue: MakeOptionalUndefined<Pick<T, StoreKeys>>,
    defaultNonStored: Omit<T, StoreKeys>,
): Reactive<T>
export function localReactive<T extends StorageObject>(key: string, guard: TypeGuard<T>, defaultValue: T): Reactive<T>
export function localReactive(
    key: string,
    guard: TypeGuard<StorageObject>,
    defaultValue: StorageObject,
    defaultNonStored?: StorageObject,
): Reactive<StorageObject> {
    const stored = reactive({ ...defaultValue, ...deserialize(localStorage.getItem(key), guard) })
    watch(stored, val => localStorage.setItem(key, JSON.stringify(toRaw(val))), { deep: true })
    if (!defaultNonStored) return stored
    return reactive({ ...toRefs(stored), ...defaultNonStored } as StorageObject)
}
