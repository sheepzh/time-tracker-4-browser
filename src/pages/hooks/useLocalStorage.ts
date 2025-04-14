type StoragePrimitive = string | boolean | number | undefined
type StorageArray = Array<StorageValue>
type StorageObject = { [key: string]: StorageValue }
type StorageValue =
    | StoragePrimitive
    | StorageArray
    | StorageObject

export const useLocalStorage = <T = StorageValue>(key: string, defaultVal?: T): [data: T | undefined, setter: (val: T | undefined) => void] => {
    const setter = (val: T | undefined) => {
        if (val === undefined || val === null) {
            localStorage?.removeItem(key)
        } else {
            localStorage?.setItem(key, JSON.stringify(val))
        }
    }
    let storedVal = localStorage.getItem(key)
    if (!storedVal) {
        return [defaultVal, setter]
    }

    try {
        return [JSON.parse(storedVal), setter]
    } catch { }

    return [defaultVal, setter]
}