import { IS_ANDROID } from "@util/constant/environment"
import { handleError } from "./common"

export function isNoneWindowId(windowId: number | undefined) {
    return windowId === undefined || windowId === chrome.windows.WINDOW_ID_NONE
}

export function getFocusedNormalWindowId(): Promise<number | undefined> {
    if (IS_ANDROID) {
        return Promise.resolve(undefined)
    }
    return new Promise(resolve => chrome.windows.getLastFocused(
        { windowTypes: ['normal'] },
        window => {
            handleError('getFocusedNormalWindow')
            if (!window) {
                resolve(undefined)
                return
            }
            const { focused, id } = window
            if (!focused || !id || isNoneWindowId(id)) {
                resolve(undefined)
            } else {
                resolve(id)
            }
        },
    ))
}

export async function getWindow(id: number): Promise<chrome.windows.Window | undefined> {
    if (IS_ANDROID) {
        return
    }
    return new Promise(resolve => chrome.windows.get(id, win => resolve(win)))
}

type _Handler = (windowId: number) => void

export function onWindowFocusChanged(handler: _Handler) {
    if (IS_ANDROID) {
        return
    }
    chrome.windows.onFocusChanged.addListener(windowId => {
        handleError('onWindowFocusChanged')
        handler(windowId)
    })
}
