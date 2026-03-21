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

export type NormalTrackerOption = {
    onReport: (ev: timer.core.Event) => Promise<void>
    onResume?: (reason: StateChangeReason) => void
    onPause?: (reason: StateChangeReason) => void
}

/**
 * Normal tracker
 */
export default class NormalTracker {
    context: TrackContext | undefined
    start: number = Date.now()
    option: NormalTrackerOption

    constructor(option: NormalTrackerOption) {
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

        const data: timer.core.Event = {
            start: lastTime,
            end: now,
            url: location?.href,
            ignoreTabCheck: !!ignoreTabCheck
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
