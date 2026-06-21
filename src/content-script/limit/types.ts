
export type LimitReason =
    & RequiredPick<tt4b.limit.Rule, 'id' | 'cond'>
    & PartialPick<tt4b.limit.Item, 'delayCount' | 'allowDelay'>
    & {
        type: tt4b.limit.ReasonType
        getVisitTime?: () => number
    }

export interface MaskModal {
    readonly reasons: LimitReason[]

    addReason(...reasons: LimitReason[]): void
    removeReason(...reasons: LimitReason[]): void
    removeReasonsByType(...types: tt4b.limit.ReasonType[]): void
    addDelayHandler(handler: NoArgCallback): void
}

export interface Processor {
    init(): Awaitable<void>
    // Reset rules and reasons
    reset(): Promise<void>
}
