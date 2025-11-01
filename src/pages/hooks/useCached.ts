/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { onBeforeMount, ref, type Ref, watch } from "vue"
import { useState } from "."

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

export function useCached<T>(key: string, defaultValue: T, defaultFirst?: boolean): { data: Ref<T>, setter: (val: T) => void }
export function useCached<T>(
    key: string | undefined,
    defaultValue?: T,
    defaultFirst?: boolean,
): { data: Ref<T | undefined>, setter: (val: T | undefined) => void }

export function useCached<T>(
    key: string | undefined,
    defaultValue?: T,
    defaultFirst?: boolean,
) {
    if (!key) {
        const [data, setter] = useState(defaultValue)
        return { data, setter }
    }
    const data: Ref<T | undefined> = ref<T>()
    const setter = (val: T | undefined) => data.value = val
    onBeforeMount(() => {
        let cachedValue = getInitialValue(key, defaultValue)
        let initial = defaultFirst ? defaultValue || cachedValue : cachedValue
        setter(initial)
    })
    watch(data, () => saveCache(key, data.value))
    return { data, setter }
}
