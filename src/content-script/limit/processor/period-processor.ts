import { trySendMsg2Runtime } from '@api/sw/common'
import { date2Idx } from "@util/limit"
import { MILL_PER_SECOND } from "@util/time"
import type { LimitReason, ModalContext, Processor } from '../types'

function processRule(rule: tt4b.limit.Rule, nowSeconds: number, context: ModalContext): ReturnType<typeof setTimeout>[] {
    const { cond, periods, id } = rule
    if (!periods?.length) return []
    return periods.flatMap(p => {
        const [s, e] = p
        const startSeconds = s * 60
        const endSeconds = (e + 1) * 60
        const reason: LimitReason = { id, cond, type: 'PERIOD' }
        const timers: ReturnType<typeof setTimeout>[] = []
        if (nowSeconds < startSeconds) {
            timers.push(setTimeout(() => context.modal.addReason(reason), (startSeconds - nowSeconds) * MILL_PER_SECOND))
            timers.push(setTimeout(() => context.modal.removeReason(reason), (endSeconds - nowSeconds) * MILL_PER_SECOND))
        } else if (nowSeconds >= startSeconds && nowSeconds <= endSeconds) {
            context.modal.addReason(reason)
            timers.push(setTimeout(() => context.modal.removeReason(reason), (endSeconds - nowSeconds) * MILL_PER_SECOND))
        }
        return timers
    })
}

class PeriodProcessor implements Processor {
    private timers: ReturnType<typeof setTimeout>[] = []

    constructor(private readonly context: ModalContext) { }

    async onLimitChanged(): Promise<void> {
        await this.initRules()
    }

    init(): void {
    }

    clear(_urlChanged?: boolean): void {
        this.timers.forEach(clearTimeout)
        this.timers = []
        this.context.modal.removeReasonsByType('PERIOD')
    }

    private async initRules(): Promise<void> {
        const url = this.context.url
        this.clear()
        const rules = await trySendMsg2Runtime('limit.list', { effective: true, url }) ?? []
        if (url !== this.context.url) return
        const nowSeconds = date2Idx(new Date())
        this.timers = rules.flatMap(r => processRule(r, nowSeconds, this.context))
    }
}

export default PeriodProcessor