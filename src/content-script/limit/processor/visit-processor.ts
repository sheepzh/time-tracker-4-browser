import { trySendMsg2Runtime } from '@api/sw/common'
import NormalTracker from "@cs/tracker/normal"
import { MILL_PER_MINUTE, MILL_PER_SECOND } from "@util/time"
import type { ModalContext, Processor } from '../types'

class VisitProcessor implements Processor {
    private focusTime: number = 0
    private rules: tt4b.limit.Rule[] = []
    tracker: NormalTracker
    private delayCount: number = 0

    constructor(private readonly context: ModalContext, private readonly delayDuration: number) {
        this.tracker = new NormalTracker({
            onReport: data => this.handleTracker(data),
        })
    }

    onLimitChanged(): Promise<void> {
        return this.initRules()
    }

    private hasLimited(rule: tt4b.limit.Rule): boolean {
        const { visitTime } = rule
        if (!visitTime) return false
        const afterDelayed = visitTime * MILL_PER_SECOND + this.delayCount * this.delayDuration * MILL_PER_MINUTE
        return afterDelayed < this.focusTime
    }

    private async handleTracker({ start, end }: tt4b.core.Event) {
        const diff = end - start
        this.focusTime += diff
        this.rules.forEach(rule => {
            if (!this.hasLimited(rule)) return
            const { id, cond, allowDelay } = rule
            this.context.modal.addReason({
                id,
                cond,
                type: 'VISIT',
                allowDelay,
                delayCount: this.delayCount,
                getVisitTime: () => this.focusTime,
            })
        })
    }

    private async initRules() {
        const url = this.context.url
        this.clear()
        const rules = await trySendMsg2Runtime('limit.list', { effective: true, url }) ?? []
        if (url !== this.context.url) return
        this.rules = rules
    }

    async init(): Promise<void> {
        this.tracker.init()
        this.context.modal.addDelayHandler(() => this.processDelay())
    }

    clear(urlChanged?: boolean): void {
        this.rules = []
        if (urlChanged) {
            this.focusTime = 0
            this.delayCount = 0
        }
        this.context.modal.removeReasonsByType('VISIT')
    }

    private processDelay() {
        this.delayCount++
        this.context.modal.removeReasonsByType('VISIT')
    }
}

export default VisitProcessor