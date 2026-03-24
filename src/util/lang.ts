/**
 * @since 2.1.7
 */
export const deepCopy = <T = any | null | undefined>(obj: T): T => {
    if (!obj) return obj
    if (typeof obj !== 'object') return obj

    let deep: Record<string, any> = {}
    Object.entries(obj).forEach(([k, v]) => {
        if (typeof v !== "object" || v === null) {
            deep[k] = v
        } else if (Array.isArray(v)) {
            deep[k] = v.map(e => deepCopy(e))
        } else if (v instanceof Set) {
            deep[k] = new Set(v)
        } else if (v instanceof Map) {
            deep[k] = new Map(v)
        } else if (v instanceof Date) {
            deep[k] = new Date(v.getTime())
        } else {
            // Ignored type
            deep[k] = deepCopy(v)
        }
    })
    return deep as T
}

export const mergeObject = <T extends Record<string, any>>(defaults: T, newVal: Partial<T> | undefined): T => {
    if (newVal === undefined) return defaults

    Object.entries(newVal).forEach(([k, v]) => {
        if (typeof v === 'object' && !!v && !Array.isArray(v) && typeof defaults[k] === 'object' && !!defaults[k]) {
            (defaults as any)[k] = mergeObject(defaults[k], v as Record<string, any>)
        } else {
            (defaults as any)[k] = v
        }
    })
    return defaults
}