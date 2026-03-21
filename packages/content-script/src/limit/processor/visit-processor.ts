import { trySendMsg2Runtime } from '@api/sw/common'
import NormalTracker from "@cs/tracker/normal"
import { DELAY_MILL } from "@util/limit"
import { MILL_PER_SECOND } from "@util/time"
import type { ModalContext, Processor } from "../types"

class VisitProcessor implements Processor {

    private context: ModalContext
    private focusTime: number = 0
    private rules: timer.limit.Rule[] = []
    private tracker: NormalTracker | undefined
    private delayCount: number = 0

    constructor(context: ModalContext) {
        this.context = context
    }

    async handleMsg(code: timer.tab.ReqCode): Promise<timer.tab.Response<timer.tab.ReqCode>> {
        if (code === "limitChanged") {
            this.initRules()
            return { code: "success" }
        } else if (code === "askVisitTime") {
            return { code: "success", data: this.focusTime } satisfies timer.tab.Response<'askVisitTime'>
        }
        return { code: "ignore" }
    }

    hasLimited(rule: timer.limit.Rule): boolean {
        const { visitTime } = rule || {}
        if (!visitTime) return false
        return visitTime * MILL_PER_SECOND + this.delayCount * DELAY_MILL < this.focusTime
    }

    async handleTracker(data: timer.core.Event) {
        const diff = (data?.end ?? 0) - (data?.start ?? 0)
        this.focusTime += diff
        this.rules?.forEach?.(rule => {
            if (!this.hasLimited(rule)) return
            const { id, cond, allowDelay } = rule
            this.context.modal.addReason({
                id,
                cond,
                type: "VISIT",
                allowDelay,
                delayCount: this.delayCount,
                getVisitTime: () => this.focusTime,
            })
        })
    }

    async initRules() {
        this.rules = await trySendMsg2Runtime("limit.getEffective", this.context.url)
        this.context.modal.removeReasonsByType("VISIT")
    }

    async init(): Promise<void> {
        this.tracker = new NormalTracker({
            onReport: data => this.handleTracker(data),
        })
        this.tracker.init()
        this.initRules()
        this.context.modal.addDelayHandler(() => this.processMore5Minutes())
    }

    private processMore5Minutes() {
        this.delayCount = (this.delayCount ?? 0) + 1
        this.context.modal.removeReasonsByType("VISIT")
    }
}

export default VisitProcessor