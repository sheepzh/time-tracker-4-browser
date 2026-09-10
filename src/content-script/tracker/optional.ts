import { trySendMsg2Runtime } from '@api/sw/common'
import audible from '@cs/audible'
import locationWatcher from '@cs/location-watcher'

export default class OptionalTracker {
    #start: number = Date.now()

    init() {
        locationWatcher.onCurrChange(() => this.#tick())
        setInterval(() => this.#tick(), 500)
    }

    async #tick() {
        const now = Date.now()
        const start = this.#start
        this.#start = now

        const { isWhite, current, host } = locationWatcher
        if (isWhite) return

        const event: tt4b.core.Event = { start, end: now, ignoreTabCheck: false, host }
        const { run, media } = current?.normal.options ?? {}

        run && await trySendMsg2Runtime('track.runTime', event)
        media && audible.on && await trySendMsg2Runtime('track.mediaTime', event)
    }
}