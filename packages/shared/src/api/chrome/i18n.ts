// Bug of chrome:
// chrome.i18n.getUILanguage may not work in background
export function getUILanguage(): string {
    return chrome?.i18n?.getUILanguage?.()
}

// Bug of chrome：
// chrome.i18n.getMessage may not work in background
// @see https://stackoverflow.com/questions/6089707/calling-chrome-i18n-getmessage-from-a-content-script
export const getMessage: (key: string) => string = chrome?.i18n?.getMessage
