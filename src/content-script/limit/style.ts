const camelToKebab = (str: string): string => str.replaceAll(/[A-Z]/, ch => `-${ch.toLowerCase()}`)

export function mountStyle(el: HTMLElement, style: Partial<CSSStyleProperties>) {
    Object.entries(style).forEach(([key, val]) => el.style.setProperty(camelToKebab(key), String(val)))
}