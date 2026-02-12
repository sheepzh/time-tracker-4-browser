export interface TimelineDatabase {
    batchSave(ticks: timer.timeline.Tick[]): Promise<void>
    getAll(): Promise<timer.timeline.Tick[]>
}