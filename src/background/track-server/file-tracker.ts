import { getTab, onTabActivated } from '@api/chrome/tab'
import optionHolder from '@service/components/option-holder'
import { extractFileHost } from '@util/pattern'
import { handleTrackTimeEvent } from './normal'

type Context = {
    host: string
    tab: ChromeTab
    // Start timestamp of this tick
    start: number
}

async function convertContext(tabId: number): Promise<Context | null> {
    const tab = await getTab(tabId)
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
    private enabled = false
    private current: Context | null = null

    init() {
        optionHolder.get().then(v => this.enabled = v.countLocalFiles)
        optionHolder.addChangeListener(v => this.enabled = v.countLocalFiles)

        onTabActivated(async tabId => {
            this.tick()
            this.current = await convertContext(tabId)
        })

        // NOTE: if migrate to MV3, this line won't work expectedly
        setInterval(() => this.tick(), 1000)
    }

    private tick() {
        if (!this.current) return
        const { host, tab, start } = this.current
        const end = Date.now()
        this.enabled && handleTrackTimeEvent({
            host, start, end,
            url: tab.url ?? '',
            ignoreTabCheck: false,
        }, tab)
        this.current.start = end
    }
}

export default FileTracker