import { sendMsg2Runtime } from '@api/chrome/runtime'

class TimelineCollector {
    private startTime: number | null = null

    /**
     * Bind page visibility and focus events
     */
    init(): void {
        const onStateChange = () => {
            if (!document.hidden && document.hasFocus()) {
                this.startTracking()
            } else {
                this.collect()
            }
        }

        document.addEventListener('visibilitychange', onStateChange)
        window.addEventListener('focus', onStateChange)
        window.addEventListener('blur', onStateChange)
        window.addEventListener('beforeunload', () => this.collect())

        if (document.readyState === 'complete') {
            onStateChange()
        } else {
            window.addEventListener('load', onStateChange)
        }
    }

    /**
     * Start tracking current page
     */
    public startTracking(): void {
        if (document.hidden || !document.hasFocus()) return
        if (this.startTime !== null) return
        this.startTime = Date.now()
    }

    /**
     * End current session and generate event
     */
    private collect(): void {
        if (!this.startTime) return
        const url = document?.location?.href

        url && sendMsg2Runtime('cs.timelineEv', {
            start: this.startTime,
            end: Date.now(),
            url,
        } satisfies timer.timeline.Event)

        this.startTime = null
    }
}


export default function processTimeline() {
    const collector = new TimelineCollector()
    collector.init()
}