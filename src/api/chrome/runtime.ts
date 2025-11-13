import { handleError } from "./common"

export function getRuntimeId(): string {
    return chrome.runtime.id
}

export function getRuntimeName(): string {
    return chrome.runtime.getManifest().name
}

/**
 * Fix proxy data failed to serialized in Firefox
 */
function cloneData<T = any>(data: T | undefined): T | undefined {
    if (data === undefined) return undefined
    try {
        return JSON.parse(JSON.stringify(data))
    } catch (cloneError) {
        console.warn("Failed clone data", cloneError)
        return data
    }
}

export function sendMsg2Runtime<T = any, R = any>(code: timer.mq.ReqCode, data?: T): Promise<R | undefined> {
    const request: timer.mq.Request<T> = { code, data: cloneData(data) }
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            // timeout: no response from runtime
            resolve(undefined)
        }, 10_000)
        try {
            chrome.runtime.sendMessage(request, (response: timer.mq.Response<R>) => {
                clearTimeout(timeout)
                handleError('sendMsg2Runtime')
                const resCode = response?.code
                resCode === 'fail' && reject(new Error(response?.msg || 'Unknown error'))
                resCode === 'success' && resolve(response.data)
            })
        } catch (e) {
            clearTimeout(timeout)
            reject('Failed to send message: ' + (e as Error)?.message || 'Unknown error')
        }
    })
}

/**
 * Wrap for hooks, after the extension reloaded or upgraded, the context of current content script will be invalid
 * And sending messages to the runtime will be failed
 */
export async function trySendMsg2Runtime<Req, Res>(code: timer.mq.ReqCode, data?: Req): Promise<Res | undefined> {
    try {
        return await sendMsg2Runtime(code, data)
    } catch {
        // ignored
    }
}

export function onRuntimeMessage<T = any, R = any>(handler: ChromeMessageHandler<T, R>): void {
    // Be careful!!!
    // Can't use await/async in callback parameter
    chrome.runtime.onMessage.addListener((message: timer.mq.Request<T>, sender: chrome.runtime.MessageSender, sendResponse: timer.mq.Callback<R>) => {
        handler(message, sender).then((response: timer.mq.Response<R>) => {
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