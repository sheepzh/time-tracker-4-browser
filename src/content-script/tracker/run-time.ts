import { trySendMsg2Runtime } from '@api/sw/common'
import { extractHostname } from '@util/pattern'
import Dispatcher from '../dispatcher'

class RunTimeTracker {
    private start: number = Date.now()
    // Real host, including builtin hosts
    private host: string | undefined

    constructor(private readonly url: string) {
    }

    init(dispatcher: Dispatcher): void {
        this.fetchSite()
        dispatcher.register('siteRunChange', () => void this.fetchSite())
        setInterval(() => this.collect(), 1000)
    }

    private async fetchSite() {
        const { host } = extractHostname(this.url)
        if (!host) return
        const enabled = await trySendMsg2Runtime('site.runEnabled', host)
        this.host = enabled ? host : undefined
    }

    private async collect() {
        const now = Date.now()
        const lastTime = this.start

        try {
            if (this.host) {
                const event: timer.core.Event = {
                    start: lastTime,
                    end: now,
                    ignoreTabCheck: false,
                    host: this.host,
                }
                await trySendMsg2Runtime('track.runTime', event)
            }
            this.start = now
        } catch {
        }
    }
}

export default RunTimeTracker