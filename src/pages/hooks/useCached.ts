/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { ref, type Ref, watch } from "vue"

const getInitialValue = <T>(key: string, defaultValue?: T): T | undefined => {
    if (!key) return defaultValue
    const exist = localStorage.getItem(key)
    if (!exist) return defaultValue
    try {
        return JSON.parse(exist) as T
    } catch (e) {
        return undefined
    }
}

const saveCache = <T>(key: string, val: T) => {
    if (!key) return
    if (val === null || val === undefined || val === '') {
        localStorage.removeItem(key)
    } else {
        localStorage.setItem(key, JSON.stringify(val))
    }
}

export function useCached<T>(key: string, defaultValue: T): [data: Ref<T>, setter: ArgCallback<T>]
export function useCached<T>(key: string, defaultValue?: T): [data: Ref<T | undefined>, setter: ArgCallback<T | undefined>]
export function useCached<T>(key: string, defaultValue?: T) {
    let cachedValue = getInitialValue(key, defaultValue)
    let initial = cachedValue ?? defaultValue
    const data = initial === undefined ? ref<T>() : ref<T>(initial)
    const setter = (val: T | undefined) => data.value = val
    watch(data, () => saveCache(key, data.value), { immediate: true })
    return [data, setter]
}
