import { isRecord } from './guard'

export const mergeObject = <T extends Record<string, any>>(target: T, toMerge: Partial<T> | undefined): T => {
    if (toMerge === undefined) return target

    Object.entries(toMerge).forEach(([k, v]) => {
        const oldV = target[k]
        if (isRecord(v) && isRecord(oldV)) {
            (target as any)[k] = mergeObject(oldV, v)
        } else {
            (target as any)[k] = v
        }
    })
    return target
}

export const anyChanged = <T>(newVal: T, oldVal: T, ...keys: (keyof T)[]): boolean =>
    keys.some(key => newVal[key] !== oldVal[key])