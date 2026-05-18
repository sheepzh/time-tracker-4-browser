import ClassicTimelineDatabase from './classic'
import IDBTimelineDatabase from './idb'
import type { TimelineCondition, TimelineDatabase } from './types'

class TimelineDatabaseWrapper implements TimelineDatabase {
    private classic = new ClassicTimelineDatabase()
    private idb = new IDBTimelineDatabase()

    batchSave(ticks: tt4b.timeline.Tick[]): Promise<void> {
        return this.idb.batchSave(ticks)
    }

    select(cond?: TimelineCondition): Promise<tt4b.timeline.Tick[]> {
        return this.idb.select(cond)
    }

    async migrateFromClassic(): Promise<void> {
        const ticks = await this.classic.select()
        await this.idb.batchSave(ticks)
        await this.classic.clear()
    }
}

const timelineDatabase = new TimelineDatabaseWrapper()

export default timelineDatabase