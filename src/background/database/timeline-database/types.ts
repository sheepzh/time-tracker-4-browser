export type TimelineCondition = {
    host?: string
    /**
     * Start time in milliseconds, inclusive
     */
    start?: number
}

export interface TimelineDatabase {
    batchSave(ticks: tt4b.timeline.Tick[]): Promise<void>
    select(cond?: TimelineCondition): Promise<tt4b.timeline.Tick[]>
}