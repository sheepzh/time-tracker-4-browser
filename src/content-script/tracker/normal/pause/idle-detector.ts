import { getOption } from '@api/sw/option'
import audible from '@cs/audible'
import BasePauseDetector from './base'

export default class IdleDetector extends BasePauseDetector {
    #fullScreen: boolean = false
    // By milliseconds
    #autoPauseInterval?: number
    #lastActiveTime: number = Date.now()
    #pauseTimeout?: ReturnType<typeof setTimeout>

    get paused() {
        if (this.#fullScreen || audible.on) return false
        if (!this.#autoPauseInterval) return false
        return this.#lastActiveTime + this.#autoPauseInterval <= Date.now()
    }

    constructor() {
        super()
        void this.init()
    }

    async init() {
        await this.#syncOptions()
        this.#startOptionPolling()

        const handleActive = this.#throttle(() => {
            this.#lastActiveTime = Date.now()
            this.notify()
            this.#scheduleTimeout()
        }, 100)

        window.addEventListener('mousedown', handleActive)
        window.addEventListener('mousemove', handleActive)
        window.addEventListener('keydown', handleActive)
        window.addEventListener('scroll', handleActive)
        window.addEventListener('wheel', handleActive)

        document?.addEventListener('fullscreenchange', () => {
            this.#fullScreen = !!document.fullscreenElement
            this.notify()
            this.#scheduleTimeout()
        })

        document?.addEventListener('visibilitychange', async () => {
            document.visibilityState === 'visible' && await this.#syncOptions()
            this.notify()
        })

        audible.onChange(() => this.notify())
    }

    async #syncOptions() {
        try {
            const { autoPauseTracking, autoPauseInterval } = await getOption()
            const enabled = autoPauseTracking && autoPauseInterval > 0
            this.#autoPauseInterval = enabled ? autoPauseInterval * 1000 : undefined

            this.notify()
            this.#scheduleTimeout()
        } catch (e) {
            console.info("[tt4b] Failed to query auto-idle option", e)
        }
    }

    #onTimeout() {
        this.#pauseTimeout = undefined
        this.notify()
        !this.paused && this.#scheduleTimeout()
    }

    #scheduleTimeout() {
        this.#clearTimeout()
        const interval = this.#autoPauseInterval
        if (!interval) return

        if (this.#fullScreen) {
            // in fullscreen mode, we don't want to pause tracking, so we set a timeout to check again after the autoPauseInterval
            this.#pauseTimeout = setTimeout(() => this.#onTimeout(), interval)
        } else {
            const timeoutTs = this.#lastActiveTime + interval
            const now = Date.now()
            const detectInterval = timeoutTs <= now ? interval : (timeoutTs - now)
            this.#pauseTimeout = setTimeout(() => this.#onTimeout(), detectInterval)
        }
    }

    #clearTimeout() {
        if (!this.#pauseTimeout) return
        clearTimeout(this.#pauseTimeout)
        this.#pauseTimeout = undefined
    }

    #startOptionPolling() {
        const pollInterval = setInterval(() => this.#syncOptions(), 60_000)
        const cleanup = () => clearInterval(pollInterval)
        window.addEventListener('beforeunload', cleanup)
    }

    #throttle(fn: NoArgCallback, ms: number): NoArgCallback {
        let last = 0
        return () => {
            const now = Date.now()
            if (now - last < ms) return
            last = now
            fn()
        }
    }
}