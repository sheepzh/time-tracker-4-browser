import { trySendMsg2Runtime } from '@api/sw/common'
import Dispatcher from '@cs/dispatcher'
import LocationWatcher from '@cs/location-watcher'

class MediaTimeTracker {
    #audible: boolean = false
    #start: number = Date.now()

    constructor(private readonly location: LocationWatcher) {
        location.onCurrChange(() => this.collect())
        trySendMsg2Runtime('cs.getAudible').then(val => this.#audible = !!val)
    }

    init(dispatcher: Dispatcher): void {
        setInterval(() => this.collect(), 1000)
        dispatcher.register('syncAudible', val => this.#audible = !!val)
    }

    private async collect() {
        const now = Date.now()
        const lastTime = this.#start
        this.#start = now

        if (this.location.isWhite) return
        if (!this.#audible) return
        // Media time tracking only available for normal site
        if (!this.location.current?.normal.options?.media) return

        const event: tt4b.core.Event = {
            start: lastTime,
            end: now,
            ignoreTabCheck: false,
            host: this.location.host,
        }
        await trySendMsg2Runtime('track.mediaTime', event)
    }
}

export default MediaTimeTracker