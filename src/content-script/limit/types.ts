
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

export type SharedOption = {
    /**
     * Whether to display the countdown
     */
    countdown: boolean
    /**
     * Delay duration, minutes
     */
    delayDuration: number
}

export type VisitData = {
    /**
     * Tracked milliseconds of current visit
     */
    readonly mills: number
    /**
     * Times of delaying current visit
     */
    readonly delayCount: number
    onChange(listener: ArgCallback<number>): void
}