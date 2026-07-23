// Bug of chrome:
// chrome.i18n.getUILanguage may not work in background
export function getUILanguage(): string {
    return globalThis.chrome?.i18n?.getUILanguage?.()
}
