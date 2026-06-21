
export type LimitReason =
    & RequiredPick<tt4b.limit.Rule, 'id' | 'cond'>
    & PartialPick<tt4b.limit.Item, 'delayCount' | 'allowDelay'>
    & {
        type: tt4b.limit.ReasonType
        getVisitTime?: () => number
    }

export type LimitReasonData = Omit<LimitReason, 'getVisitTime'> | FocusReason

export type FocusReason =
    & tt4b.focus.Session & { presetName: string | undefined }
    & {
        type: 'FOCUS'
    }

export type Reason = LimitReason | FocusReason
export type ReasonType = Reason['type']

export interface MaskModal {
    readonly reasons: Reason[]

    addReason(...reasons: Reason[]): void
    removeReason(...reasons: Reason[]): void
    removeReasonsByType(...types: ReasonType[]): void
    addDelayHandler(handler: NoArgCallback): void
}

export interface Processor {
    init(): Awaitable<void>
    // Reset rules and reasons
    reset(): Promise<void>
}
