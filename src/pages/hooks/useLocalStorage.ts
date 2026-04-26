
type StoragePrimitive = string | boolean | number | undefined
type StorageArray = Array<StorageValue>
type StorageObject = { [key: string]: StorageValue }
type StorageValue =
    | StoragePrimitive
    | StorageArray
    | StorageObject

export function useLocalStorage<T>(key: string, defaultValue: T): [T, ArgCallback<T>]
export function useLocalStorage<T>(key: string): [T | undefined, (val: T | undefined) => void]
export function useLocalStorage<T = StorageValue>(key: string, defaultVal?: T): [data: T | undefined, setter: ArgCallback<T | undefined>] {
    const value: T | undefined = deserialize(localStorage.getItem(key)) ?? defaultVal

    const setter = (val: T | undefined) => {
        if (val === undefined) {
            localStorage.removeItem(key)
        } else {
            localStorage.setItem(key, JSON.stringify(val))
        }
    }

    return [value, setter]
}

function deserialize<T>(json: string | null): T | undefined {
    if (!json) return undefined

    try {
        return JSON.parse(json) as T
    } catch {
        return undefined
    }
}