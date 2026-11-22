import type { LocationQuery } from 'vue-router'

type QueryValue = Exclude<LocationQuery[string], null>

export function queryStr(query: QueryValue): string
export function queryStr(query: QueryValue | null | undefined): string | undefined
export function queryStr(query: QueryValue | null | undefined) {
    return (Array.isArray(query) ? query[0] ?? '' : query) ?? undefined
}

export const queryInt = (query: QueryValue | undefined) => {
    const str = queryStr(query)
    if (!str) return undefined
    const val = Number.parseInt(str)
    return Number.isInteger(val) ? val : undefined
}

export type MakeRouteQuery<T> = Partial<Record<keyof T, QueryValue>>