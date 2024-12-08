import IdleDetector from "./idle-detector"

const INTERVAL = 1000

type StateChangeReason = 'visible' | 'idle' | 'initial'

class TrackContext {
    docVisible: boolean = false
    idleDetector: IdleDetector
    onPause: (reason: StateChangeReason) => void
    onResume: (reason: StateChangeReason) => void

    constructor({ onPause, onResume }: { onPause: (reason: StateChangeReason) => void, onResume: (reason: StateChangeReason) => void }) {
        this.onPause = onPause
        this.onResume = onResume

        this.init()
    }

    private init() {
        this.detectDocVisible()
        document?.addEventListener('visibilitychange', () => this.detectDocVisible())

        this.idleDetector = new IdleDetector({
            onIdle: () => this.onPause?.('idle'),
            onActive: () => this.docVisible && this.onResume?.('idle')
        })
    }

    private detectDocVisible() {
        const before = this.isActive()
        this.docVisible = document?.visibilityState === 'visible'
        const after = this.isActive()

        before && !after && this.onPause?.('visible')
        !before && after && this.onResume?.('visible')
    }

    isActive(): boolean {
        if (!this.docVisible) return false
        return !this.idleDetector?.needTimeout() || !this.idleDetector?.isIdle()
    }
}

export type TrackerClientOption = {
    onReport: (ev: timer.stat.Event) => Promise<void>
    onResume?: (reason: StateChangeReason) => void
    onPause?: (reason: StateChangeReason) => void
}

/**
 * Tracker client, used in the content-script
 */
export default class TrackerClient {
    context: TrackContext
    start: number = Date.now()
    option: TrackerClientOption

    constructor(option: TrackerClientOption) {
        this.option = option
    }

    init() {
        // Resume if idle before reloading
        this.resume('idle')

        this.context = new TrackContext({
            onPause: reason => this.pause(reason),
            onResume: reason => this.resume(reason),
        })
        setInterval(() => {
            if (!this.context?.isActive()) return

            this.collect()
        }, INTERVAL)
    }

    private async collect(ignoreTabCheck?: boolean) {
        const now = Date.now()
        const lastTime = this.start
        this.start = now
        const interval = now - lastTime
        if (interval <= 0 || interval > INTERVAL * 2) {
            // Invalid time
            return
        }

        const data: timer.stat.Event = {
            start: lastTime,
            end: now,
            url: location?.href,
            ignoreTabCheck
        }
        try {
            await this.option?.onReport?.(data)
        } catch (_) { }
    }

    private pause(reason: StateChangeReason) {
        this.option?.onPause?.(reason)

        this.collect(true)
    }

    private resume(reason: StateChangeReason) {
        this.option?.onResume?.(reason)

        this.start = Date.now()
    }
}
