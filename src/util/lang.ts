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