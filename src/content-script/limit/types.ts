
export type LimitReason =
    & RequiredPick<tt4b.limit.Rule, 'id' | 'cond' | 'allowDelay'>
    & PartialPick<tt4b.limit.Item, 'delayCount'>
    & { type: tt4b.limit.ReasonType }

export type FocusReason =
    & tt4b.focus.Session & { presetName: string | undefined }
    & { type: 'FOCUS' }

export type Reason = LimitReason | FocusReason
export type ReasonType = Reason['type']

export interface Processor {
    init(): Awaitable<void>
    // Reset rules and reasons
    reset(): Promise<void>
}
