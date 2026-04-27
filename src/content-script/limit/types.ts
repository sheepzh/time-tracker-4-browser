
export type LimitReason =
    & RequiredPick<timer.limit.Rule, 'id' | 'cond'>
    & PartialPick<timer.limit.Item, 'delayCount' | 'allowDelay'>
    & {
        type: timer.limit.ReasonType
        getVisitTime?: () => number
    }

export interface MaskModal {
    readonly reasons: LimitReason[]

    addReason(...reasons: LimitReason[]): void
    removeReason(...reasons: LimitReason[]): void
    removeReasonsByType(...types: timer.limit.ReasonType[]): void
    addDelayHandler(handler: NoArgCallback): void
}

export type ModalContext = {
    url: string
    modal: MaskModal
}

export interface Processor {
    init(): Awaitable<void>
    onLimitChanged(items: timer.limit.Item[]): void
}