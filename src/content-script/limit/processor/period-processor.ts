import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import { isInPeriod } from '@util/limit'
import type { MaskModal, Processor, Reason } from '../types'

type EffectiveResult = {
    effective: boolean
    startTime?: Date
    endTime: Date
}
const date2Point = (date: Date): number => date.getHours() * 60 + date.getMinutes()

const calcEffective = (p: tt4b.limit.Period, now: Date): EffectiveResult => {
    const point = date2Point(now)
    const [s, e] = p
    const effective = isInPeriod(point, p)
    const endTime: Date = new Date(now)
    const endExclusive = e === 1440 ? 0 : (e + 1) % 1440
    endTime.setHours(Math.floor(endExclusive / 60), endExclusive % 60, 0, 0)
    if (endTime <= now) endTime.setDate(endTime.getDate() + 1)
    const result: EffectiveResult = { effective, endTime }

    if (!effective) {
        const startTime: Date = new Date(now)
        startTime.setHours(Math.floor(s / 60), s % 60, 0, 0)
        if (startTime <= now) startTime.setDate(startTime.getDate() + 1)
        result.startTime = startTime
    }
    return result
}

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
        const now = new Date()
        this.#timers = rules.flatMap(r => this.#processRule(r, now))
    }

    #processRule(rule: tt4b.limit.Rule, now: Date): ReturnType<typeof setTimeout>[] {
        const { cond, periods, id } = rule
        if (!periods?.length) return []
        const nowTs = now.getTime()
        return periods.flatMap(p => {
            const { effective, startTime, endTime } = calcEffective(p, now)
            const reason: Reason = { id, cond, type: 'PERIOD' }
            const timers: ReturnType<typeof setTimeout>[] = [
                setTimeout(() => {
                    this.modal.removeReason(reason)
                    void this.reset()
                }, endTime.getTime() - nowTs),
            ]
            if (effective) {
                this.modal.addReason(reason)
            } else if (startTime) {
                const startTimer = setTimeout(() => this.modal.addReason(reason), startTime.getTime() - nowTs)
                timers.push(startTimer)
            }
            return timers
        })
    }
}

export default PeriodProcessor
