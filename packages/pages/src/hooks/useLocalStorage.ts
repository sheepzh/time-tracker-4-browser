
type StoragePrimitive = string | boolean | number | undefined
type StorageArray = Array<StorageValue>
type StorageObject = { [key: string]: StorageValue }
type StorageValue =
    | StoragePrimitive
    | StorageArray
    | StorageObject

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (val: T | undefined) => void]
export function useLocalStorage<T>(key: string): [T | undefined, (val: T | undefined) => void]

export function useLocalStorage<T = StorageValue>(key: string, defaultVal?: T): [data: T | undefined, setter: (val: T | undefined) => void] {
    const value = deserialize(localStorage.getItem(key), defaultVal) ?? defaultVal

    const setter = (val: T | undefined) => {
        if (val === undefined) {
            localStorage?.removeItem(key)
        } else {
            localStorage?.setItem(key, JSON.stringify(val))
        }
    }

    return [value, setter]
}

function deserialize<T>(json: string | null, defaultVal?: T): T | undefined {
    if (!json) return undefined

    try {
        const stored = JSON.parse(json) || {}
        Object.entries(defaultVal || {}).forEach(([k, v]) => {
            if (stored[k] === undefined || stored[k] === null) {
                stored[k] = v
            }
        })
        return stored
    } catch {
        return undefined
    }
}