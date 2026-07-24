import Dispatcher from '@cs/dispatcher'
import DocVisibleDetector from './pause/doc-visible-detector'
import IdleDetector from './pause/idle-detector'
import { PauseDetector, PauseReason } from './types'

const INTERVAL = 1000

type NormalTrackerOption = {
    onReport: (ev: tt4b.core.Event) => Promise<void>
    onResume?: ArgCallback<PauseReason>
    onPause?: ArgCallback<PauseReason>
}

/**
 * Normal tracker
 */
export default class NormalTracker {
    #start: number = Date.now()
    #detectors: PauseDetector[] = []
    #wasPaused: [boolean, PauseReason | undefined]

    constructor(private readonly option: NormalTrackerOption) {
        this.#wasPaused = [this.paused, 'initial']
    }

    get paused() {
        return this.#detectors.some(d => d.paused)
    }

    init(dispatcher: Dispatcher, ...pauseDetectors: PauseDetector[]) {
        const idle = new IdleDetector()
        const docVisible = new DocVisibleDetector()
        dispatcher.registerAudibleChange(idle)
        this.#detectors.push(...pauseDetectors, idle, docVisible)
        this.#detectors.forEach(d => d.onPauseChange(target => this.#reconcile(target.reason)))

        // Resume if idle before reloading
        this.resume('idle')

        setInterval(() => !this.paused && this.collect(), INTERVAL)
    }

    #reconcile(reason: PauseReason) {
        const now = this.paused
        if (now === this.#wasPaused[0] && reason === this.#wasPaused[1]) return
        this.#wasPaused = [now, reason]
        now ? this.pause(reason) : this.resume(reason)
    }

    private async collect(ignoreTabCheck?: boolean) {
        const now = Date.now()
        const lastTime = this.#start
        this.#start = now
        const interval = now - lastTime
        if (interval <= 0 || interval > INTERVAL * 2) {
            // Invalid time
            return
        }

        const data: tt4b.core.Event = {
            start: lastTime,
            end: now,
            ignoreTabCheck: !!ignoreTabCheck
        }
        try {
            await this.option?.onReport?.(data)
        } catch (_) { }
    }

    private pause(reason: PauseReason) {
        this.option?.onPause?.(reason)

        this.collect(true)
    }

    private resume(reason: PauseReason) {
        this.option?.onResume?.(reason)

        this.#start = Date.now()
    }
}
