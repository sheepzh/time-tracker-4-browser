import Dispatcher from '@cs/dispatcher'
import DocVisibleDetector from './pause/doc-visible-detector'
import IdleDetector from './pause/idle-detector'
import type { PauseDetector } from './types'

const INTERVAL = 1000

type NormalTrackerOption = {
    onReport: (ev: tt4b.core.Event) => Awaitable<void>
    onResume?: NoArgCallback
    onPause?: NoArgCallback
}

/**
 * Normal tracker
 */
export default class NormalTracker {
    #start: number = Date.now()
    #detectors: PauseDetector[] = []
    #wasPaused: boolean

    constructor(private readonly option: NormalTrackerOption) {
        this.#wasPaused = this.paused
    }

    get paused() {
        return this.#detectors.some(d => d.paused)
    }

    init(dispatcher: Dispatcher, ...pauseDetectors: PauseDetector[]) {
        const idle = new IdleDetector()
        const docVisible = new DocVisibleDetector()
        dispatcher.register('syncAudible', val => idle.onAudibleChange(val))
        this.#detectors.push(...pauseDetectors, idle, docVisible)
        this.#detectors.forEach(d => d.onPauseChange(() => this.#reconcile()))

        // Resume if idle before reloading
        this.#resume()

        setInterval(() => !this.paused && this.#collect(), INTERVAL)
    }

    #reconcile() {
        const now = this.paused
        if (now === this.#wasPaused) return
        this.#wasPaused = now
        now ? this.#pause() : this.#resume()
    }

    async #collect(ignoreTabCheck?: boolean) {
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

    #pause() {
        this.option?.onPause?.()
        this.#collect(true)
    }

    #resume() {
        this.option?.onResume?.()
        this.#start = Date.now()
    }
}
