import { getTab, onTabActivated, onTabUpdated } from '@api/chrome/tab'
import { onWindowFocusChanged } from '@api/chrome/window'
import optionHolder from '@service/components/option-holder'
import { extractFileHost } from '@util/pattern'
import { handleTrackTimeEvent } from './normal'

type Context = {
    host: string
    tab: ChromeTab
    // Start timestamp of this tick
    start: number
}

async function convertContext(tabOrId: number | ChromeTab): Promise<Context | null> {
    const tab = typeof tabOrId === 'number' ? await getTab(tabOrId) : tabOrId
    if (!tab) return null
    const { active, url } = tab
    if (!active || !url) return null
    const fileHost = extractFileHost(url)
    if (!fileHost) return null
    return {
        host: fileHost, tab,
        start: Date.now(),
    }
}

/**
 * Local file tracker for firefox
 */
class FileTracker {
    #enabled = false
    #current: Context | null = null
    // Context saved when window loses focus, restored when focus returns
    #suspended: Context | null = null
    #windowFocused = true

    async init() {
        optionHolder.get()
            .then(v => this.#enabled = v.countLocalFiles)
            .catch(e => console.info("Failed to get countLocalFiles:", e))
        optionHolder.addChangeListener(v => this.#enabled = v.countLocalFiles)

        onTabActivated(async tabId => {
            this.#tick()
            this.#current = await convertContext(tabId)
            this.#suspended = null
        })

        onTabUpdated(async (_tabId, changeInfo, tab) => {
            if (!changeInfo.url || !tab.active) return
            const newContext = await convertContext(tab)
            if (this.#current?.host !== newContext?.host) {
                // File host changed or navigated away from file URL
                this.#tick()
                this.#current = newContext
                this.#suspended = null
            }
        })

        onWindowFocusChanged(async windowId => {
            if (windowId === chrome.windows.WINDOW_ID_NONE) {
                this.#tick()
                this.#suspended = this.#current
                this.#current = null
                this.#windowFocused = false
            } else if (!this.#windowFocused) {
                this.#windowFocused = true
                if (this.#suspended) {
                    // Re-validate: tab may have been closed or navigated away during blur
                    const suspendedTabId = this.#suspended.tab.id
                    this.#suspended = null
                    this.#current = suspendedTabId ? await convertContext(suspendedTabId) : null
                }
            }
        })

        // NOTE: if migrate to MV3, this line won't work expectedly
        setInterval(() => this.#tick(), 1000)
    }

    #tick() {
        if (!this.#current) return
        const { host, tab, start } = this.#current
        const end = Date.now()
        if (this.#enabled) {
            void handleTrackTimeEvent({ host, start, end, ignoreTabCheck: true }, tab)
        }
        this.#current.start = end
    }
}

export default FileTracker