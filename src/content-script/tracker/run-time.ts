import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'

class RunTimeTracker {
    #start: number = Date.now()

    constructor(private readonly location: LocationWatcher) {
        location.onCurrChange(() => this.collect())
    }

    init(): void {
        setInterval(() => this.collect(), 1000)
    }

    private async collect() {
        const now = Date.now()
        const lastTime = this.#start
        this.#start = now

        if (this.location.isWhite) return
        // Run time tracking only available for normal site
        if (!this.location.current?.normal.options?.run) return

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