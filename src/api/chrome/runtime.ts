
export function getRuntimeId(): string {
    return chrome.runtime.id
}

export function getRuntimeName(): string {
    return chrome.runtime.getManifest().name
}

export function getIconUrl(): string {
    return getUrl('static/images/icon.png')
}

export function onTabMessage(handler: ChromeTabMessageHandler): void {
    // Be careful!!!
    // Can't use await/async in callback parameter
    chrome.runtime.onMessage.addListener((message: timer.tab.Request<timer.tab.ReqCode>, sender: chrome.runtime.MessageSender, sendResponse: timer.tab.Callback<timer.tab.ReqCode>) => {
        handler(message, sender).then((response: timer.tab.Response<timer.tab.ReqCode>) => {
            if (response.code === 'ignore') return
            sendResponse(response)
        })
        // 'return true' will force chrome to wait for the response processed in the above promise.
        // @see https://github.com/mozilla/webextension-polyfill/issues/130
        return true
    })
}

export function onRuntimeMessage(handler: ChromeMessageHandler): void {
    // Be careful!!!
    // Can't use await/async in callback parameter
    chrome.runtime.onMessage.addListener((message: timer.mq.Request<timer.mq.ReqCode>, sender: chrome.runtime.MessageSender, sendResponse: timer.mq.Callback<timer.mq.ReqCode>) => {
        handler(message, sender).then((response: timer.mq.Response<timer.mq.ReqCode>) => {
            if (response.code === 'ignore') return
            sendResponse(response)
        })
        // 'return true' will force chrome to wait for the response processed in the above promise.
        // @see https://github.com/mozilla/webextension-polyfill/issues/130
        return true
    })
}

export function onInstalled(handler: (reason: ChromeOnInstalledReason) => void): void {
    chrome.runtime.onInstalled.addListener(detail => handler(detail.reason))
}

export function getVersion(): string {
    return chrome.runtime.getManifest().version
}

export function setUninstallURL(url: string): Promise<void> {
    return new Promise(resolve => chrome.runtime.setUninstallURL(url, resolve))
}

/**
 * Get the url of this extension
 *
 * @param path The path relative to the root directory of this extension
 */
export function getUrl(path: string): string {
    return chrome.runtime.getURL(path)
}

export async function isAllowedFileSchemeAccess(): Promise<boolean> {
    const res = await chrome.extension?.isAllowedFileSchemeAccess?.()
    return !!res
}