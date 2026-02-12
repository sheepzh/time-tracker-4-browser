import type { TimelineDatabase } from './types'

export default class IDBTimelineDatabase implements TimelineDatabase {
    batchSave(ticks: timer.timeline.Tick[]): Promise<void> {
        throw new Error('Method not implemented.')
    }
    getAll(): Promise<timer.timeline.Tick[]> {
        throw new Error('Method not implemented.')
    }
}