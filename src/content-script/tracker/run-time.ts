import { onTabMessage } from "@api/chrome/runtime"
import { trySendMsg2Runtime } from '@api/sw/common'

class RunTimeTracker {
    private start: number = Date.now()
    private url: string
    // Real host, including builtin hosts
    private host: string | undefined

    constructor(url: string) {
        this.url = url
        this.start = Date.now()
    }

    init(): void {
        this.fetchSite()

        onTabMessage(async req => {
            if (req.code === 'siteRunChange') {
                this.fetchSite()
                return { code: 'success' }
            }
            return { code: 'ignore' }
        })

        setInterval(() => this.collect(), 1000)
    }

    private async fetchSite() {
        const site = await trySendMsg2Runtime('cs.getRunSites', this.url)
        this.host = site?.host
    }

    private async collect() {
        const now = Date.now()
        const lastTime = this.start

        try {
            if (this.host) {
                const event: timer.core.Event = {
                    start: lastTime,
                    end: now,
                    url: this.url,
                    ignoreTabCheck: false,
                    host: this.host,
                }
                await trySendMsg2Runtime('cs.trackRunTime', event)
            }
            this.start = now
        } catch {
        }
    }
}

export default RunTimeTracker