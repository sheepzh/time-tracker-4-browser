import { IS_ANDROID } from "@util/constant/environment"
import { handleError } from "./common"

type WindowSimple = {
    id: number
    focused?: boolean
}

class WindowHolder {
    private windows: Map<number, WindowSimple> = new Map()
    private lastFocusedId: number | undefined = undefined

    async init(): Promise<void> {
        if (IS_ANDROID) return

        this.windows.clear()
        this.lastFocusedId = undefined

        const windows = await listAllWindow()
        windows.forEach(({ id, focused }) => id !== undefined && this.windows.set(id, ({ id, focused })))
        this.lastFocusedId = await getLastFocusedId()

        chrome.windows.onCreated.addListener(({ id, focused }) => {
            if (id === undefined) return

            this.windows.set(id, { id, focused })
            focused && (this.lastFocusedId = id)
        })

        chrome.windows.onRemoved.addListener(id => this.windows.delete(id))

        chrome.windows.onFocusChanged.addListener(async winId => {
            for (const [id, info] of this.windows) {
                // WINDOW_ID_NONE === winId means all the window change to non-focused
                info.focused = id === winId
            }

            if (winId !== chrome.windows.WINDOW_ID_NONE) {
                const window = await getWindow(winId)
                window?.type === 'normal' && (this.lastFocusedId = winId)
            }
        })
    }

    get(windowId: number): WindowSimple | undefined {
        return this.windows.get(windowId)
    }

    getLatestFocusedId(): number | undefined {
        return this.lastFocusedId
    }
}

function listAllWindow(): Promise<chrome.windows.Window[]> {
    if (IS_ANDROID) return Promise.resolve([])
    return new Promise(resolve => chrome.windows.getAll(
        { windowTypes: ['normal'] },
        list => {
            handleError('listAllWindow')
            resolve(list)
        },
    ))
}

function getLastFocusedId(): Promise<number | undefined> {
    if (IS_ANDROID) return Promise.resolve(undefined)
    return new Promise(resolve => chrome.windows.getLastFocused(
        { windowTypes: ['normal'] },
        ({ id }) => {
            handleError('getLastFocusedId')
            resolve(id)
        },
    ))
}

function getWindow(id: number): Promise<ChromeWindow | undefined> {
    if (IS_ANDROID) return Promise.resolve(undefined)
    return new Promise(resolve => chrome.windows.get(id, window => {
        handleError('getWindow')
        resolve(window)
    }))
}

export const windowHolder = new WindowHolder()
windowHolder.init().catch(err => console.error('windowHolder.init failed', err))

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
