// Minimal chrome mock (indexed-storage uses chrome.runtime.id lazily)
;(global as any).chrome = { runtime: { id: 'test-ext' } }

jest.mock('@db/timeline-database', () => ({
    __esModule: true,
    default: {
        migrateFromClassic: jest.fn().mockResolvedValue(undefined),
    },
}))

import IndexedMigrator from '@src/background/migrator/indexed-migrator'
import timelineDatabase from '@db/timeline-database'

const migrateSpy = timelineDatabase.migrateFromClassic as jest.Mock

describe('IndexedMigrator', () => {
    beforeEach(() => {
        migrateSpy.mockClear()
    })

    test('onInstall does not trigger migration', () => {
        const migrator = new IndexedMigrator()
        migrator.onInstall()
        expect(migrateSpy).not.toHaveBeenCalled()
    })

    test('onUpdate from v3.x triggers migration (major < 4)', async () => {
        const migrator = new IndexedMigrator()
        migrator.onUpdate('3.8.15')
        await Promise.resolve()
        expect(migrateSpy).toHaveBeenCalledTimes(1)
    })

    test('onUpdate from v2.x triggers migration (major < 4)', async () => {
        const migrator = new IndexedMigrator()
        migrator.onUpdate('2.0.0')
        await Promise.resolve()
        expect(migrateSpy).toHaveBeenCalledTimes(1)
    })

    test('onUpdate from v4.x does NOT trigger migration (already on IndexedDB)', async () => {
        const migrator = new IndexedMigrator()
        migrator.onUpdate('4.0.0')
        await Promise.resolve()
        expect(migrateSpy).not.toHaveBeenCalled()
    })

    test('onUpdate from v5.x does NOT trigger migration', async () => {
        const migrator = new IndexedMigrator()
        migrator.onUpdate('5.1.0')
        await Promise.resolve()
        expect(migrateSpy).not.toHaveBeenCalled()
    })

    test('onUpdate with malformed version does NOT trigger migration', async () => {
        const migrator = new IndexedMigrator()
        migrator.onUpdate('')
        await Promise.resolve()
        expect(migrateSpy).not.toHaveBeenCalled()
    })
})
