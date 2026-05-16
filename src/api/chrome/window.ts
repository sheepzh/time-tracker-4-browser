import { IS_ANDROID, IS_MV3 } from "@util/constant/environment"
import { handleError } from "./common"

export async function getLastFocusedId(): Promise<number | undefined> {
    if (IS_ANDROID) return Promise.resolve(undefined)
    if (IS_MV3) {
        const window = await chrome.windows.getLastFocused({ windowTypes: ['normal'] })
        return window.id
    }
    return new Promise(resolve => chrome.windows.getLastFocused(
        { windowTypes: ['normal'] },
        ({ id }) => {
            handleError('getLastFocusedId')
            resolve(id)
        },
    ))
}

export function getWindow(id: number): Promise<ChromeWindow | undefined> {
    if (IS_ANDROID) return Promise.resolve(undefined)
    return new Promise(resolve => chrome.windows.get(id, window => {
        handleError('getWindow')
        resolve(window)
    }))
}

export function isNoneWindowId(windowId: number | undefined) {
    return windowId === undefined || windowId === chrome.windows.WINDOW_ID_NONE
}

export function onWindowFocusChanged(handler: ArgCallback<number>) {
    if (IS_ANDROID) return
    chrome.windows.onFocusChanged.addListener(windowId => {
        handleError('onWindowFocusChanged')
        handler(windowId)
    })
}
