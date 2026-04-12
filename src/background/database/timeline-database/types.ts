export type TimelineCondition = {
    host?: string
    /**
     * Start time in milliseconds, inclusive
     */
    start?: number
}

export interface TimelineDatabase {
    batchSave(ticks: timer.timeline.Tick[]): Promise<void>
    select(cond?: TimelineCondition): Promise<timer.timeline.Tick[]>
}