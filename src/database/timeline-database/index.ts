import { StorageHolder } from '@db/common/storage-holder'
import type { StorageMigratable } from '@db/types'
import ClassicTimelineDatabase from './classic'
import IDBTimelineDatabase from './idb'
import type { TimelineDatabase } from './types'

type Composite = TimelineDatabase & StorageMigratable<timer.timeline.Tick[]>

class TimelineDatabaseWrapper implements Composite {
    private holder = new StorageHolder<TimelineDatabase>({
        classic: new ClassicTimelineDatabase(),
        indexed_db: new IDBTimelineDatabase(),
    })

    private current = () => this.holder.current

    batchSave(ticks: timer.timeline.Tick[]): Promise<void> {
        return this.current().batchSave(ticks)
    }

    getAll(): Promise<timer.timeline.Tick[]> {
        return this.current().getAll()
    }

    migrateStorage(type: timer.option.StorageType): Promise<timer.timeline.Tick[]> {
        throw new Error('Method not implemented.')
    }

    afterStorageMigrated(allData: timer.timeline.Tick[]): Promise<void> {
        throw new Error('Method not implemented.')
    }
}

const timelineDatabase = new TimelineDatabaseWrapper()

export default timelineDatabase