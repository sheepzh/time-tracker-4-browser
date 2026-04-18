import { trySendMsg2Runtime } from '@api/sw/common'
import { getOption } from '@api/sw/option'

export default class IdleDetector {
    fullScreen: boolean = false
    // default to true, try not to affect tracking
    audible: boolean = true

    autoPauseTracking: boolean = false
    // By milliseconds
    autoPauseInterval: number = -1

    lastActiveTime: number = Date.now()
    userActive: boolean = true
    pauseTimeout: ReturnType<typeof setTimeout> | undefined

    constructor(private readonly onIdle: NoArgCallback, private readonly onActive: NoArgCallback) {
        this.onIdle = onIdle
        this.onActive = onActive
    }

    needTimeout(): boolean {
        return this.autoPauseTracking && this.autoPauseInterval > 0
    }

    isIdle() {
        if (this.fullScreen || this.audible) return false
        return this.lastActiveTime + this.autoPauseInterval <= Date.now()
    }

    async init() {
        this.reset()
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && this.reset())
        const pollInterval = setInterval(() => this.reset(), 60_000)
        const stopPoll = () => clearInterval(pollInterval)
        window.addEventListener('beforeunload', stopPoll)

        const handleActive = () => {
            this.lastActiveTime = Date.now()

            if (!this.needTimeout()) return

            if (!this.pauseTimeout) {
                this.onActive()
                this.resetTimeout()
            }
        }

        window.addEventListener('mousedown', handleActive)
        window.addEventListener('mousemove', handleActive)
        window.addEventListener('keydown', handleActive)
        window.addEventListener('scroll', handleActive)
        window.addEventListener('wheel', handleActive)
        document?.addEventListener('fullscreenchange', () => {
            this.fullScreen = !!document?.fullscreenElement
            handleActive()
        })

        trySendMsg2Runtime('cs.getAudible').then(val => this.audible = !!val)
    }

    private reset() {
        getOption().then(({ autoPauseTracking, autoPauseInterval }) => {
            this.autoPauseTracking = autoPauseTracking
            this.autoPauseInterval = autoPauseInterval * 1000

            this.resetTimeout()
        }).catch(() => { })
    }

    private resetTimeout() {
        if (!!this.pauseTimeout) {
            clearTimeout(this.pauseTimeout)
            this.pauseTimeout = undefined
        }

        if (!this.needTimeout()) return

        const timeoutTs = this.lastActiveTime + this.autoPauseInterval
        const now = Date.now()

        const detectInterval = this.fullScreen
            ? this.autoPauseInterval
            : timeoutTs <= now ? this.autoPauseInterval : (timeoutTs - now)

        this.pauseTimeout = setTimeout(() => this.handleTimeout(), detectInterval)
    }

    private handleTimeout() {
        this.pauseTimeout = undefined

        if (!this.needTimeout()) return

        if (this.isIdle()) {
            this.onIdle()
        } else {
            this.resetTimeout()
        }
    }
}