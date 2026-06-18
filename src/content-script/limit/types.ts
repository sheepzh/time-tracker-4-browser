
export type LimitReason =
    & RequiredPick<tt4b.limit.Rule, 'id' | 'cond'>
    & PartialPick<tt4b.limit.Item, 'delayCount' | 'allowDelay'>
    & {
        type: tt4b.limit.ReasonType
        getVisitTime?: () => number
    }

export interface MaskModal {
    readonly reasons: LimitReason[]

    setUrl(url: string): void
    addReason(...reasons: LimitReason[]): void
    removeReason(...reasons: LimitReason[]): void
    removeReasonsByType(...types: tt4b.limit.ReasonType[]): void
    addDelayHandler(handler: NoArgCallback): void
}

export type ModalContext = {
    url: string
    modal: MaskModal
}

export type UrlRefreshContext = {
    prevUrl: string
    nextUrl: string
    whitelisted: boolean
}

export interface Processor {
    init(): Awaitable<void>
    onUrlRefreshed(ctx: UrlRefreshContext): Awaitable<void>
}
