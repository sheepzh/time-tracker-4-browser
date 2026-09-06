const camelToKebab = (str: string): string => str.replace(/[A-Z]/g, ch => `-${ch.toLowerCase()}`)

export function mountStyle(el: HTMLElement, style: Partial<CSSStyleProperties>) {
    Object.entries(style).forEach(([key, val]) => el.style.setProperty(camelToKebab(key), String(val ?? '')))
}
