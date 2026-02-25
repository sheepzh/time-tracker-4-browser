import timelineDatabase from '@db/timeline-database'
import type { Migrator } from './types'

class IndexedMigrator implements Migrator {
    onInstall(): void {
    }
    onUpdate(_version: string): void {
        timelineDatabase.migrateFromClassic()
            .then(() => console.log('Timeline data migrated to IndexedDB'))
            .catch(e => console.error('Failed to migrate timeline data to IndexedDB', e))
    }
}

export default IndexedMigrator