import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import Dispatcher from '../dispatcher'

class RunTimeTracker {
    #start: number = Date.now()
    #enabled = false

    constructor(private readonly location: LocationWatcher) {
        location.onChange(() => {
            this.collect()
            this.fetchEnabled()
        })
    }

    init(dispatcher: Dispatcher): void {
        void this.fetchEnabled()
        dispatcher.register('siteRunChange', () => void this.fetchEnabled())
        setInterval(() => this.collect(), 1000)
    }

    private async fetchEnabled() {
        this.#enabled = !this.location.whitelisted
            && !!(await trySendMsg2Runtime('site.runEnabled', this.location.host))
    }

    private async collect() {
        const now = Date.now()
        const lastTime = this.#start
        this.#start = now

        if (!this.#enabled) return

        const event: tt4b.core.Event = {
            start: lastTime,
            end: now,
            ignoreTabCheck: false,
            host: this.location.host,
        }
        await trySendMsg2Runtime('track.runTime', event)
    }
}

export default RunTimeTracker