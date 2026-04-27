export const TAG_NAME = 'extension-time-tracker-overlay'

export class RootElement extends HTMLElement {
    constructor() {
        super()
    }
}

export function createRootElement(): RootElement {
    const element = document.createElement(TAG_NAME) as RootElement
    element.style.display = 'block'
    element.style.position = 'fixed'
    element.style.inset = '0'
    element.style.width = '100vw'
    element.style.height = '100vh'
    element.style.zIndex = String(Number.MAX_SAFE_INTEGER)
    return element
}
