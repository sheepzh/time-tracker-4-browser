export const setDir = (direction: 'ltr' | 'rtl') => {
    if (isNotExtensionPage()) return
    const htmlEl = document.getElementsByTagName("html")?.[0]
    htmlEl?.setAttribute('dir', direction)
}

export const setLocale = (locale: timer.Locale) => {
    if (isNotExtensionPage()) return
    const htmlEl = document.getElementsByTagName("html")?.[0]
    htmlEl?.setAttribute('data-locale', locale)
}

const isNotExtensionPage = (): boolean => {
    if (typeof location === 'undefined' || typeof chrome === 'undefined' || typeof window === 'undefined') {
        return true
    }

    const { protocol } = location || {}

    if (protocol === 'https:' || protocol === 'http:' || protocol === "ftp:" || protocol === "file:") {
        return true
    }

    return !chrome.runtime?.id
}

export const isRtl = (): boolean => {
    if (isNotExtensionPage()) return false
    const htmlEl = document.getElementsByTagName("html")?.[0]
    return htmlEl?.getAttribute('dir') === 'rtl'
}

export function stopPropagationAfter<T extends Event>(ev: T, handle: (ev: T) => void) {
    handle?.(ev)
    ev?.stopPropagation?.()
}