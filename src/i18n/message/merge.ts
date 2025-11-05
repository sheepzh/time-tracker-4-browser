const ALL_LOCALE_VALIDATOR: { [locale in timer.Locale]: 0 } = {
    en: 0,
    zh_CN: 0,
    ja: 0,
    zh_TW: 0,
    pt_PT: 0,
    uk: 0,
    es: 0,
    de: 0,
    fr: 0,
    ru: 0,
    ar: 0,
    tr: 0,
}

export const ALL_LOCALES: timer.Locale[] = Object.keys(ALL_LOCALE_VALIDATOR) as timer.Locale[]

export type MessageRoot<T = any> = { [key in keyof T]: Messages<T[key]> }

export function merge<T>(messageRoot: MessageRoot<T>): Required<Messages<T>> {
    const result: Partial<Record<timer.Locale, T & EmbeddedPartial<T>>> = {}
    ALL_LOCALES.forEach(locale => {
        const message = messageOfRoot(locale, messageRoot)
        result[locale] = message as T & EmbeddedPartial<T>
    })
    return result as Required<Messages<T>>
}

function messageOfRoot<T>(locale: timer.Locale, messageRoot: MessageRoot<T>): T {
    const entries: [string, any][] = Object.entries(messageRoot).map(([key, val]) => ([key, (val as Record<timer.Locale, T & EmbeddedPartial<T>>)[locale]]))
    const result = Object.fromEntries(entries) as T
    return result
}