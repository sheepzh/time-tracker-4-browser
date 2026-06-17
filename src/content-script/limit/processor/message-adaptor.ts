import { trySendMsg2Runtime } from '@api/sw/common'
import { hasDailyLimited, hasWeeklyLimited, matches } from "@util/limit"
import type { LimitReason, ModalContext, Processor } from '../types'

const cvtItem2AddReason = (item: tt4b.limit.Item, delayDuration: number): LimitReason[] => {
    const { cond, allowDelay, id, delayCount, weeklyDelayCount } = item
    const reasons2Add: LimitReason[] = []
    hasDailyLimited(item, delayDuration) && reasons2Add.push({ type: "DAILY", cond, allowDelay, id, delayCount })
    hasWeeklyLimited(item, delayDuration) && reasons2Add.push({ type: 'WEEKLY', cond, allowDelay, id, delayCount: weeklyDelayCount })
    return reasons2Add
}

class MessageAdaptor implements Processor {
    constructor(private readonly context: ModalContext, private readonly delayDuration: number) { }

    onLimitChanged(): Promise<void> {
        return this.initRules()
    }

    onLimitTimeMeet(items: tt4b.limit.Item[]): void {
        if (!items.length) return
        items.filter(({ cond }) => matches(cond, this.context.url))
            .flatMap(item => cvtItem2AddReason(item, this.delayDuration))
            .forEach(reason => this.context.modal.addReason(reason))
    }

    async init(): Promise<void> {
        this.context.modal.addDelayHandler(() => void this.initRules())
    }

    clear(_urlChanged?: boolean): void {
        this.context.modal.removeReasonsByType('DAILY', 'WEEKLY')
    }

    async initRules(): Promise<void> {
        const url = this.context.url
        this.clear()
        const limitedRules = await trySendMsg2Runtime('limit.list', { limited: true, effective: true, url })
        if (url !== this.context.url || !limitedRules?.length) return

        const reasons = limitedRules.flatMap(item => cvtItem2AddReason(item, this.delayDuration))
        this.context.modal.addReason(...reasons)
    }
}

export default MessageAdaptor
