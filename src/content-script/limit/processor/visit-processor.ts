import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import NormalTracker from "@cs/tracker/normal"
import { MILL_PER_MINUTE, MILL_PER_SECOND } from "@util/time"
import ModalInstance from '../modal/instance'
import type { Processor } from '../types'

class VisitProcessor implements Processor {
    private focusTime: number = 0
    private rules: tt4b.limit.Rule[] = []
    tracker: NormalTracker
    private delayCount: number = 0

    constructor(
        private readonly modal: ModalInstance,
        private readonly location: LocationWatcher,
        private readonly delayDuration: number,
    ) {
        this.tracker = new NormalTracker({
            onReport: data => this.handleTracker(data),
        })
        location.onChange(async ({ prevUrl, nextUrl }) => {
            if (prevUrl === nextUrl) return
            // reset focus time and delay count when url changed
            this.focusTime = 0
            this.delayCount = 0
        })
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
            this.modal.addReason({
                id,
                cond,
                type: 'VISIT',
                allowDelay,
                delayCount: this.delayCount,
                getVisitTime: () => this.focusTime,
            })
        })
    }

    async init(): Promise<void> {
        this.tracker.init()
        this.modal.addDelayHandler(() => {
            this.delayCount++
            this.modal.removeReasonsByType('VISIT')
        })

        void this.reset()
    }

    async reset() {
        this.rules = []
        this.modal.removeReasonsByType('VISIT')
        if (this.location.whitelisted) return

        this.rules = await trySendMsg2Runtime('limit.list', { effective: true, url: this.location.url }) ?? []
    }
}

export default VisitProcessor
