import { trySendMsg2Runtime } from '@api/sw/common'
import { hasDailyLimited, hasWeeklyLimited, matches } from "@util/limit"
import type { LimitReason, ModalContext, Processor } from '../types'

const cvtItem2AddReason = (item: timer.limit.Item, delayDuration: number): LimitReason[] => {
    const { cond, allowDelay, id, delayCount, weeklyDelayCount } = item
    const reasons2Add: LimitReason[] = []
    hasDailyLimited(item, delayDuration) && reasons2Add.push({ type: "DAILY", cond, allowDelay, id, delayCount })
    hasWeeklyLimited(item, delayDuration) && reasons2Add.push({ type: 'WEEKLY', cond, allowDelay, id, delayCount: weeklyDelayCount })
    return reasons2Add
}

class MessageAdaptor implements Processor {
    constructor(private readonly context: ModalContext, private readonly delayDuration: number) { }

    onLimitChanged(items: timer.limit.Item[]): void {
        this.context.modal.removeReasonsByType("DAILY", "WEEKLY")
        items.flatMap(item => cvtItem2AddReason(item, this.delayDuration))
            .forEach(reason => this.context.modal.addReason(reason))
    }

    onLimitTimeMeet(items: timer.limit.Item[]): void {
        if (!items.length) return
        items.filter(({ cond }) => matches(cond, this.context.url))
            .flatMap(item => cvtItem2AddReason(item, this.delayDuration))
            .forEach(reason => this.context.modal.addReason(reason))
    }

    async init(): Promise<void> {
        this.initRules()
        this.context.modal.addDelayHandler(() => this.initRules())
    }

    async initRules(): Promise<void> {
        this.context.modal.removeReasonsByType('DAILY', 'WEEKLY')
        const limitedRules = await trySendMsg2Runtime('limit.list', { limited: true, url: this.context.url })
        if (!limitedRules?.length) return

        const reasons = limitedRules.flatMap(item => cvtItem2AddReason(item, this.delayDuration))
        this.context.modal.addReason(...reasons)
    }
}

export default MessageAdaptor
