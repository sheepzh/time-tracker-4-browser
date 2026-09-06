import { trySendMsg2Runtime } from '@api/sw/common'
import LocationWatcher from '@cs/location-watcher'
import { hasDailyLimited, hasWeeklyLimited, matches } from "@util/limit"
import DelayCoordinator from '../manager/delay-coordinator'
import LimitState from '../manager/state'
import type { Processor, Reason, SharedOption } from '../types'

const cvtItem2AddReason = (item: tt4b.limit.Item, delayDuration: number): Reason[] => {
    const { cond, allowDelay, id, delayCount, weeklyDelayCount } = item
    const reasons2Add: Reason[] = []
    hasDailyLimited(item, delayDuration) && reasons2Add.push({ type: "DAILY", cond, allowDelay, id, delayCount })
    hasWeeklyLimited(item, delayDuration) && reasons2Add.push({ type: 'WEEKLY', cond, allowDelay, id, delayCount: weeklyDelayCount })
    return reasons2Add
}

class DailyWeeklyProcessor implements Processor {
    constructor(
        private readonly state: LimitState,
        private readonly delayCoord: DelayCoordinator,
        private readonly location: LocationWatcher,
        private readonly option: SharedOption,
    ) { }

    async onTimeMeet(items: tt4b.limit.Item[]): Promise<void> {
        if (!items.length) return
        if (this.location.isWhite) return

        items.filter(({ cond }) => matches(cond, this.location.url))
            .flatMap(item => cvtItem2AddReason(item, this.option.delayDuration))
            .forEach(reason => this.state.add(reason))
    }

    async init(): Promise<void> {
        this.delayCoord.register(() => trySendMsg2Runtime('limit.delay', this.location.url), 'DAILY', 'WEEKLY')
        await this.reset()
    }

    async reset(): Promise<void> {
        this.state.removeByType('DAILY', 'WEEKLY')
        if (this.location.isWhite) return

        const limitedRules = await trySendMsg2Runtime('limit.list', {
            limited: true, effective: true,
            url: this.location.url,
        })
        if (!limitedRules?.length) return

        const reasons = limitedRules.flatMap(item => cvtItem2AddReason(item, this.option.delayDuration))
        this.state.add(...reasons)
    }
}

export default DailyWeeklyProcessor
