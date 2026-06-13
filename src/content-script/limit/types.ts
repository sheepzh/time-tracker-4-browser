
export type LimitReason =
    & RequiredPick<tt4b.limit.Rule, 'id' | 'cond'>
    & PartialPick<tt4b.limit.Item, 'delayCount' | 'allowDelay'>
    & {
        type: tt4b.limit.ReasonType
        getVisitTime?: () => number
    }

export type LimitReasonData = Omit<LimitReason, 'getVisitTime'> | FocusReason

export type FocusReason =
    & Pick<tt4b.focus.Config, 'mode' | 'cond' | 'template'>
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

export type ModalContext = {
    url: string
    modal: MaskModal
}

export interface Processor {
    init(): Awaitable<void>
    onLimitChanged(): void
}