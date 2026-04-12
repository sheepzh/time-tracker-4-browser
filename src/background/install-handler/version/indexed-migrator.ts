import { BaseIDBStorage } from '@db/common/indexed-storage'
import { IDBStatDatabase } from '@db/stat-database/idb'
import timelineDatabase from '@db/timeline-database'
import IDBTimelineDatabase from '@db/timeline-database/idb'
import type { Migrator } from './types'

async function upgradeIndexedDB() {
    try {
        const storages: BaseIDBStorage<any>[] = [new IDBStatDatabase(), new IDBTimelineDatabase()]
        for (const storage of storages) {
            await storage.upgrade()
        }
        console.log('IndexedDB upgraded successfully')
    } catch (error) {
        console.error('Failed to upgrade IndexedDB', error)
    }
}

class IndexedMigrator implements Migrator {
    onInstall(): void {
    }

    async onUpdate(_version: string): Promise<void> {
        await upgradeIndexedDB()

        timelineDatabase.migrateFromClassic()
            .then(() => console.log('Timeline data migrated to IndexedDB'))
            .catch(e => console.error('Failed to migrate timeline data to IndexedDB', e))
    }
}

export default IndexedMigrator