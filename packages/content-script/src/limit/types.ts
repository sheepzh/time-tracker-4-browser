
export type LimitReason =
    & RequiredPick<timer.limit.Rule, 'id' | 'cond'>
    & PartialPick<timer.limit.Item, 'delayCount' | 'allowDelay'>
    & {
        type: timer.limit.ReasonType
        getVisitTime?: () => number
    }

export interface MaskModal {
    addReason(...reasons: LimitReason[]): void
    removeReason(...reasons: LimitReason[]): void
    removeReasonsByType(...types: timer.limit.ReasonType[]): void
    addDelayHandler(handler: () => void): void
}

export type ModalContext = {
    url: string
    modal: MaskModal
}

export interface Processor {
    handleMsg(code: timer.tab.ReqCode, data: unknown): Awaitable<timer.tab.Response<timer.tab.ReqCode>>
    init(): void | Promise<void>
}