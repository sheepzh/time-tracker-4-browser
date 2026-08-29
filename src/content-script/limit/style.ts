
export function mountStyle(el: HTMLElement, style: Partial<CSSStyleProperties>) {
    Object.entries(style).forEach(([key, val]) => typeof val === 'string' && el.style.setProperty(key, val))
}