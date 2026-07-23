import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import { isInPeriod } from '@util/limit'
import { MILL_PER_MINUTE } from '@util/time'
import DelayCoordinator from '../manager/delay-coordinator'
import LimitState from '../manager/state'
import type { Processor, Reason } from '../types'

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
        private readonly state: LimitState,
        private readonly delayCoord: DelayCoordinator,
        private readonly location: LocationWatcher,
        private readonly delayDuration: number,
    ) {
    }

    async init(): Promise<void> {
        await this.reset()
        this.delayCoord.register(() => {
            this.#clean()
            const resumeTimer = setTimeout(() => void this.reset(), MILL_PER_MINUTE * this.delayDuration)
            this.#timers.push(resumeTimer)
        }, 'PERIOD')
    }

    async reset(): Promise<void> {
        this.#clean()
        if (this.location.whitelisted) return

        const rules = await trySendMsg2Runtime('limit.list', { effective: true, url: this.location.url }) ?? []
        const now = new Date()
        this.#timers = rules.flatMap(r => this.#processRule(r, now))
    }

    #processRule(rule: tt4b.limit.Rule, now: Date): ReturnType<typeof setTimeout>[] {
        const { cond, periods, id, allowDelay } = rule
        if (!periods?.length) return []
        const nowTs = now.getTime()
        return periods.flatMap(p => {
            const { effective, startTime, endTime } = calcEffective(p, now)
            const reason: Reason = { id, cond, type: 'PERIOD', allowDelay }
            const timers: ReturnType<typeof setTimeout>[] = [
                setTimeout(() => {
                    this.state.remove(reason)
                    void this.reset()
                }, endTime.getTime() - nowTs),
            ]
            if (effective) {
                this.state.add(reason)
            } else if (startTime) {
                const startTimer = setTimeout(() => this.state.add(reason), startTime.getTime() - nowTs)
                timers.push(startTimer)
            }
            return timers
        })
    }

    #clean() {
        this.#timers.forEach(clearTimeout)
        this.#timers = []
        this.state.removeByType('PERIOD')
    }
}

export default PeriodProcessor
