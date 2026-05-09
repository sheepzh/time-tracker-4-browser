export function cleanCond(origin: string): string
export function cleanCond(origin: undefined): undefined
export function cleanCond(origin: string | undefined): string | undefined {
    if (!origin) return undefined

    const startIdx = origin?.indexOf('//')
    const endIdx = origin?.indexOf('?')
    let res = origin.substring(startIdx === -1 ? 0 : startIdx + 2, endIdx === -1 ? undefined : endIdx)
    while (res.endsWith('/')) {
        res = res.substring(0, res.length - 1)
    }
    return res || undefined
}