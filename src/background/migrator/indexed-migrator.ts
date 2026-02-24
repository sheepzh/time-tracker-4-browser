import timelineDatabase from '@db/timeline-database'
import type { Migrator } from './types'

// IndexedDB support was introduced in v4.0.0
const INDEXED_DB_MIN_VERSION = 4

class IndexedMigrator implements Migrator {
    onInstall(): void {
    }
    onUpdate(previousVersion: string): void {
        const major = parseInt(previousVersion.split('.')[0] ?? '0', 10)
        if (isNaN(major) || major >= INDEXED_DB_MIN_VERSION) return

        timelineDatabase.migrateFromClassic()
            .then(() => console.log('Timeline data migrated to IndexedDB'))
            .catch(e => console.error('Failed to migrate timeline data to IndexedDB', e))
    }
}

export default IndexedMigrator