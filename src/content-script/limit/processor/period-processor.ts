import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import { date2Idx } from "@util/limit"
import { MILL_PER_SECOND } from "@util/time"
import type { MaskModal, Processor, Reason } from '../types'

class PeriodProcessor implements Processor {
    #timers: ReturnType<typeof setTimeout>[] = []

    constructor(
        private readonly modal: MaskModal,
        private readonly location: LocationWatcher,
    ) {
    }

    init(): void {
        void this.reset()
    }

    async reset(): Promise<void> {
        this.#timers.forEach(clearTimeout)
        this.#timers = []
        this.modal.removeReasonsByType('PERIOD')
        if (this.location.whitelisted) return

        const rules = await trySendMsg2Runtime('limit.list', { effective: true, url: this.location.url }) ?? []
        const nowSeconds = date2Idx(new Date())
        this.#timers = rules.flatMap(r => this.#processRule(r, nowSeconds))
    }

    #processRule(rule: tt4b.limit.Rule, nowSeconds: number,): ReturnType<typeof setTimeout>[] {
        const { cond, periods, id } = rule
        if (!periods?.length) return []
        return periods.flatMap(p => {
            const [s, e] = p
            const startSeconds = s * 60
            const endSeconds = (e + 1) * 60
            const reason: Reason = { id, cond, type: 'PERIOD' }
            const timers: ReturnType<typeof setTimeout>[] = []
            if (nowSeconds < startSeconds) {
                timers.push(setTimeout(() => this.modal.addReason(reason), (startSeconds - nowSeconds) * MILL_PER_SECOND))
                timers.push(setTimeout(() => this.modal.removeReason(reason), (endSeconds - nowSeconds) * MILL_PER_SECOND))
            } else if (nowSeconds >= startSeconds && nowSeconds <= endSeconds) {
                this.modal.addReason(reason)
                timers.push(setTimeout(() => this.modal.removeReason(reason), (endSeconds - nowSeconds) * MILL_PER_SECOND))
            }
            return timers
        })
    }
}

export default PeriodProcessor
