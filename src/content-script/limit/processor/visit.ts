import { trySendMsg2Runtime } from '@api/sw/common'
import type Dispatcher from '@cs/dispatcher'
import LocationWatcher from '@cs/location-watcher'
import NormalTracker from "@cs/tracker/normal"
import { calcRealLimit, meetLimit } from '@util/limit'
import { MILL_PER_SECOND } from "@util/time"
import DelayCoordinator from '../manager/delay-coordinator'
import LimitState from '../manager/state'
import type { LimitReason, Processor, SharedOption, VisitData } from '../types'

class VisitProcessor implements Processor, VisitData {
    #mills: number = 0
    #rules: tt4b.limit.Rule[] = []
    #tracker: NormalTracker
    #delayCount: number = 0
    #listeners: ArgCallback<number>[] = []
    #lastUrl: string

    get mills() {
        return this.#mills
    }

    get delayCount() {
        return this.#delayCount
    }

    constructor(
        private readonly dispatcher: Dispatcher,
        private readonly state: LimitState,
        private readonly delayCoord: DelayCoordinator,
        private readonly location: LocationWatcher,
        private readonly option: SharedOption,
    ) {
        this.#lastUrl = location.url
        this.#tracker = new NormalTracker({
            onReport: data => this.handleTracker(data),
        })
        location.onCurrChange(() => {
            const newUrl = this.location.url
            if (this.#lastUrl === newUrl) return
            this.#lastUrl = newUrl
            // reset focus time and delay count when url changed
            this.#mills = 0
            this.#delayCount = 0
            this.#notify()
        })
        location.onCurrChange(() => void this.reset())
    }

    onChange(listener: ArgCallback<number>) {
        this.#listeners.push(listener)
        listener(this.#mills)
    }

    #notify() {
        this.#listeners.forEach(l => l(this.#mills))
    }

    private hasLimited(rule: tt4b.limit.Rule): boolean {
        const { visitTime, allowDelay } = rule
        if (!visitTime) return false
        const delay = {
            count: this.#delayCount,
            duration: this.option.delayDuration,
            allow: allowDelay,
        }
        return meetLimit(calcRealLimit(visitTime * MILL_PER_SECOND, delay), this.#mills)
    }

    private async handleTracker({ start, end }: tt4b.core.Event) {
        const diff = end - start
        this.#mills += diff
        if (this.location.isWhite) return
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
        this.#tracker.init(this.dispatcher, this.state)
        this.delayCoord.register(() => {
            this.#delayCount++
            this.state.removeByType('VISIT')
        }, 'VISIT')

        await this.reset()
    }

    async reset() {
        this.#rules = []
        this.state.removeByType('VISIT')
        if (this.location.isWhite) return

        this.#rules = await trySendMsg2Runtime('limit.list', { effective: true, url: this.location.url }) ?? []
    }
}

export default VisitProcessor
