import { trySendMsg2Runtime } from '@api/sw/common'

export default class TimelineCollector {
    private startTime: number | null = null

    /**
     * Bind page visibility and focus events
     */
    init() {
        const onStateChange = () => {
            if (document.hidden) {
                this.#collect()
            } else {
                this.startTime ??= Date.now()
            }
        }

        document.addEventListener('visibilitychange', onStateChange)
        window.addEventListener('beforeunload', () => this.#collect())

        if (document.readyState === 'complete') {
            onStateChange()
        } else {
            window.addEventListener('load', onStateChange)
        }
    }

    /**
     * End current session and generate event
     */
    #collect(): void {
        if (!this.startTime) return
        const url = document?.location?.href
        if (!url) return

        trySendMsg2Runtime('timeline.tick', { start: this.startTime, end: Date.now(), url })

        this.startTime = null
    }
}
