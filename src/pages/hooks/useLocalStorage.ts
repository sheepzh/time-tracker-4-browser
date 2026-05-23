type StoragePrimitive = string | boolean | number | undefined
type StorageArray = Array<StorageValue>
type StorageObject = { [key: string]: StorageValue }
type StorageValue =
    | StoragePrimitive
    | StorageArray
    | StorageObject

type Guard<T> = (val: unknown) => val is T

export function useLocalStorage<T>(key: string, guard: Guard<T>, defaultValue: T): [T, ArgCallback<T>]
export function useLocalStorage<T>(key: string, guard: Guard<T>): [T | undefined, (val: T | undefined) => void]
export function useLocalStorage<T = StorageValue>(key: string, guard: Guard<T>, defaultVal?: T): [data: T | undefined, setter: ArgCallback<T | undefined>] {
    const value = deserialize(localStorage.getItem(key), guard) ?? defaultVal

    const setter = (val: T | undefined) => {
        if (val === undefined) {
            localStorage.removeItem(key)
        } else {
            localStorage.setItem(key, JSON.stringify(val))
        }
    }

    return [value, setter]
}

function deserialize<T>(json: string | null, guard: Guard<T>): T | undefined {
    if (!json) return undefined

    try {
        const parsed = JSON.parse(json)
        return guard(parsed) ? parsed : undefined
    } catch {
        return undefined
    }
}