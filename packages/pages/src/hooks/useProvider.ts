import { inject, provide } from "vue"

export const useProvide = <T = Record<string, any>>(namespace: string, ctx: T) => {
    Object.entries(ctx || {}).forEach(([key, val]) => provide(`${namespace}_${key}`, val))
}

export const useProvider = <T extends Record<string, any>, P extends keyof T>(namespace: string, ...keys: P[]): Pick<T, P> => {
    const result: any = {}
    Array.from(new Set(keys || [])).forEach(key => result[key] = inject(`${namespace}_${key as string}`))
    return result as Pick<T, P>
}
