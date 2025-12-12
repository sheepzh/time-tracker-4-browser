import { IS_ANDROID, IS_FIREFOX } from "@util/constant/environment"
import { handleError } from "./common"

export function listAllWindows(): Promise<chrome.windows.Window[]> {
    if (IS_ANDROID) {
        // windows API not supported on Firefox for Android
        return Promise.resolve([])
    }
    return new Promise(resolve => chrome.windows.getAll(windows => {
        handleError("listAllWindows")
        resolve(windows || [])
    }))
}

export function isNoneWindowId(windowId: number) {
    if (IS_ANDROID) {
        return false
    }
    return !windowId || windowId === chrome.windows.WINDOW_ID_NONE
}

/**
 * Reduce invoking to improve memory leak of Firefox
 *
 * @see https://github.com/sheepzh/time-tracker-4-browser/issues/599
 */
class FocusedWindowCtx {
    last?: number | undefined
    listened: boolean = false
    windowsTypes: `${chrome.windows.WindowType}`[]

    constructor(windowTypes: `${chrome.windows.WindowType}`[]) {
        this.windowsTypes = windowTypes
    }

    async apply(): Promise<number | undefined> {
        if (IS_ANDROID) {
            return undefined
        }
        if (this.last) {
            return isNoneWindowId(this.last) ? undefined : this.last
        }
        // init
        this.last = await this.getInner()
        if (!this.listened) {
            // filter argument is not supported for Firefox
            // @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/onFocusChanged#addlistener_syntax
            IS_FIREFOX
                ? chrome.windows.onFocusChanged.addListener(wid => this.last = wid)
                : chrome.windows.onFocusChanged.addListener(wid => this.last = wid, { windowTypes: this.windowsTypes })
            this.listened = true
        }
        return this.last
    }

    private getInner(): Promise<number | undefined> {
        return new Promise(resolve => chrome.windows.getLastFocused(
            // Only find normal window
            { windowTypes: ['normal'] },
            window => {
                handleError('getFocusedNormalWindow')
                const { focused, id } = window
                if (!focused || !id || isNoneWindowId(id)) {
                    resolve(undefined)
                } else {
                    resolve(id)
                }
            }
        ))
    }
}
const context = new FocusedWindowCtx(['normal'])

export const getFocusedNormalWindowId = () => context.apply()

export async function getWindow(id: number): Promise<chrome.windows.Window | undefined> {
    if (IS_ANDROID) {
        return
    }
    return new Promise(resolve => chrome.windows.get(id, win => resolve(win)))
}

type _Handler = (windowId: number) => void

export function onNormalWindowFocusChanged(handler: _Handler) {
    if (IS_ANDROID) {
        return
    }
    chrome.windows.onFocusChanged.addListener(windowId => {
        handleError('onWindowFocusChanged')
        handler(windowId)
    })
}