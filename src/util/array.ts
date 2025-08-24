/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * Group by
 *
 * @param arr original array
 * @param keyFunc key generator
 * @returns grouped map
 * @since 1.0.0
 */
export function groupBy<T, R>(
    arr: T[],
    keyFunc: (e: T, idx: number) => string | number | undefined | null,
    downstream: (grouped: T[], key: string) => R
): Record<string | number, R> {
    const groupedMap: Record<string | number, T[]> = {}
    arr.forEach((e, i) => {
        const key = keyFunc(e, i)
        if (key === undefined || key === null) {
            return
        }
        const existArr: T[] = groupedMap[key] || []
        existArr.push(e)
        groupedMap[key] = existArr
    })
    const result: Record<string, R> = {}
    Object.entries(groupedMap)
        .forEach(([key, grouped]) => result[key] = downstream(grouped, key))
    return result
}

export function toMap<E, K extends string | number>(
    arr: E[],
    keyFun: (e: E, idx: number) => K | undefined | null,
): Record<K, E>

export function toMap<E, K extends string | number, V>(
    arr: E[],
    keyFun: (e: E, idx: number) => K | undefined | null,
    valFunc: (t: E, key: K) => V,
): Record<K, V>

/**
 * To map
 *
 * @param arr original array
 * @param keyFunc key generator
 * @param valFunc value generator
 * @returns k-v map
 * @since 3.6.1
 */
export function toMap<E, K extends string | number, V>(
    arr: E[],
    keyFunc: (e: E, idx: number) => K | undefined | null,
    valFunc?: (t: E, key: K) => V,
): Record<K, E | V> {
    const result: Record<string | number, V | E> = {}
    arr.forEach((e, i) => {
        const key = keyFunc(e, i)
        if (key === undefined || key === null) {
            return
        }
        result[key] = valFunc ? valFunc(e, key) : e
    })
    return result
}

/**
 * Rotate the array without new one returned
 *
 * @param arr the targe array
 * @param count count to rotate, must be positive, or 1 is default
 * @param rightOrLeft rotate right or left, true means left, false means right, default is false
 */
export function rotate<T>(arr: T[], count?: number, rightOrLeft?: boolean): void {
    let realTime = 1
    if (count && count > 1) {
        realTime = count
    }
    const operation = !!rightOrLeft
        // Right
        ? (a: T[]) => {
            const first = a.pop()
            first && a.unshift(first)
        }
        // Left
        : (a: T[]) => {
            const last = a.shift()
            last && a.push(last)
        }
    for (; realTime > 0; realTime--) {
        operation(arr)
    }
}

/**
 * Summarize
 *
 * @param arr target arr
 */
export function sum(arr: number[]): number {
    return arr?.reduce?.((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0
}

/**
 * @since 2.1.0
 * @returns null if arr is empty or null
 */
export function average(arr: number[]): number | null {
    if (!arr?.length) return null
    return sum(arr) / arr.length
}

export function allMatch<T>(arr: T[], predicate: (t: T) => boolean): boolean {
    return !arr?.filter?.(e => !predicate?.(e))?.length
}

export function anyMatch<T>(arr: T[], predicate: (t: T) => boolean): boolean {
    return !!arr?.filter?.(e => predicate?.(e))?.length
}

export function range(len: number): number[] {
    const arr: number[] = []
    for (let i = 0; i < len; i++) {
        arr.push(i)
    }
    return arr
}

export function containsAny<T>(arr1: T[], arr2: T[]): boolean {
    if (!arr1?.length || !arr2?.length) return false

    return !!arr1.find(e => arr2.includes(e))
}

export function joinAny<T = any>(arr: T[], separator: T): T[] {
    if (!arr.length) return [separator]

    return arr.reduce<T[]>(
        (arr, e) => {
            arr.length && arr.push(separator)
            arr.push(e)
            return arr
        },
        [],
    )
}