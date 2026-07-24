import { trySendMsg2Runtime } from '@api/sw/common'
import type Dispatcher from '@cs/dispatcher'
import LocationWatcher from '@cs/location-watcher'
import NormalTracker from "@cs/tracker/normal"
import { MILL_PER_MINUTE, MILL_PER_SECOND } from "@util/time"
import DelayCoordinator from '../manager/delay-coordinator'
import LimitState from '../manager/state'
import type { LimitReason, Processor } from '../types'

class VisitProcessor implements Processor {
    #mills: number = 0
    #rules: tt4b.limit.Rule[] = []
    #tracker: NormalTracker
    #delayCount: number = 0
    #listener?: ArgCallback<number>

    constructor(
        dispatcher: Dispatcher,
        private readonly state: LimitState,
        private readonly delayCoord: DelayCoordinator,
        private readonly location: LocationWatcher,
        private readonly delayDuration: number,
    ) {
        this.#tracker = new NormalTracker(dispatcher, {
            onReport: data => this.handleTracker(data),
        }, state)
        location.onChange(async ({ prevUrl, nextUrl }) => {
            if (prevUrl === nextUrl) return
            // reset focus time and delay count when url changed
            this.#mills = 0
            this.#delayCount = 0
            this.#notify()
        })
    }

    onChange(listener: ArgCallback<number>) {
        this.#listener = listener
    }

    #notify() {
        this.#listener?.(this.#mills)
    }

    private hasLimited(rule: tt4b.limit.Rule): boolean {
        const { visitTime } = rule
        if (!visitTime) return false
        const afterDelayed = visitTime * MILL_PER_SECOND + this.#delayCount * this.delayDuration * MILL_PER_MINUTE
        return afterDelayed < this.#mills
    }

    private async handleTracker({ start, end }: tt4b.core.Event) {
        const diff = end - start
        this.#mills += diff
        this.#notify()
        const reasons: LimitReason[] = []
        this.#rules.forEach(rule => {
            if (!this.hasLimited(rule)) return
            const { id, cond, allowDelay } = rule
            reasons.push({
                id,
                cond,
                type: 'VISIT',
                allowDelay,
                delayCount: this.#delayCount,
            })
        })
        this.state.add(...reasons)
    }

    async init(): Promise<void> {
        this.#tracker.init()
        this.delayCoord.register(() => {
            this.#delayCount++
            this.state.removeByType('VISIT')
        }, 'VISIT')

        await this.reset()
    }

    async reset() {
        this.#rules = []
        this.state.removeByType('VISIT')
        if (this.location.whitelisted) return

        this.#rules = await trySendMsg2Runtime('limit.list', { effective: true, url: this.location.url }) ?? []
    }
}

export default VisitProcessor
