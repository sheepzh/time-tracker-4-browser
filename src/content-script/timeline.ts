import { sendMsg2Runtime } from '@api/chrome/runtime'

class TimelineCollector {
    private startTime: number | null = null

    /**
     * Bind page visibility and focus events
     */
    init(): void {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.collect()
            } else {
                this.startTracking()
            }
        })

        window.addEventListener('focus', () => this.startTracking())
        window.addEventListener('blur', () => this.collect())
        window.addEventListener('beforeunload', () => this.collect())

        if (document.readyState === 'complete') {
            this.startTracking()
        } else {
            window.addEventListener('load', () => this.startTracking())
        }
    }

    /**
     * Start tracking current page
     */
    public startTracking(): void {
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