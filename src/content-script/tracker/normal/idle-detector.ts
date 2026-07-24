import { trySendMsg2Runtime } from '@api/sw/common'
import { getOption } from '@api/sw/option'
import { AudibleChangeHandler } from '@cs/types'
import { PauseDetector, PauseReason } from './types'

export default class IdleDetector implements PauseDetector, AudibleChangeHandler {
    reason: PauseReason = 'idle'

    #fullScreen: boolean = false
    // default to true, try not to affect tracking
    #audible: boolean = true
    // By milliseconds
    #autoPauseInterval?: number
    #lastActiveTime: number = Date.now()
    #pauseTimeout?: ReturnType<typeof setTimeout>
    #listener?: ArgCallback<PauseDetector>

    get paused() {
        if (this.#fullScreen || this.#audible) return false
        if (!this.#autoPauseInterval) return false
        return this.#lastActiveTime + this.#autoPauseInterval <= Date.now()
    }

    async init() {
        await this.#syncOptions()
        this.#startOptionPolling()

        const handleActive = this.#throttle(() => {
            this.#lastActiveTime = Date.now()
            this.#notify()
            this.#scheduleTimeout()
        }, 100)

        window.addEventListener('mousedown', handleActive)
        window.addEventListener('mousemove', handleActive)
        window.addEventListener('keydown', handleActive)
        window.addEventListener('scroll', handleActive)
        window.addEventListener('wheel', handleActive)

        document?.addEventListener('fullscreenchange', () => {
            this.#fullScreen = !!document.fullscreenElement
            this.#notify()
            this.#scheduleTimeout()
        })

        document?.addEventListener('visibilitychange', async () => {
            document.visibilityState === 'visible' && await this.#syncOptions()
            this.#notify()
        })

        trySendMsg2Runtime('cs.getAudible').then(val => {
            this.#audible = !!val
            this.#notify()
        })
    }

    onPauseChange(listener: ArgCallback<PauseDetector>) {
        this.#listener = listener
    }

    onAudibleChange(audible: boolean): void {
        this.#audible = audible
        this.#notify()
    }

    async #syncOptions() {
        try {
            const { autoPauseTracking, autoPauseInterval } = await getOption()
            const enabled = autoPauseTracking && autoPauseInterval > 0
            this.#autoPauseInterval = enabled ? autoPauseInterval * 1000 : undefined

            this.#notify()
            this.#scheduleTimeout()
        } catch (e) {
            console.info("[tt4b] Failed to query limit option", e)
        }
    }

    #onTimeout() {
        this.#pauseTimeout = undefined
        this.#notify()
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

    #notify() {
        this.#listener?.(this)
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