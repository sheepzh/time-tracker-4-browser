import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import IDBTimelineDatabase from '@db/timeline-database/idb'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).chrome = { runtime: { id: 'test-ext' } }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).IDBKeyRange = IDBKeyRange
// fake-indexeddb relies on structuredClone which may not be available in older jsdom
if (typeof globalThis.structuredClone === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).structuredClone = (v: unknown) => JSON.parse(JSON.stringify(v))
}

let currentFactory = new IDBFactory()

// Override window.indexedDB with fake-indexeddb before any DB is opened
Object.defineProperty(window, 'indexedDB', {
    configurable: true,
    get: () => currentFactory,
})

function freshDb(): IDBTimelineDatabase {
    // Each test gets a fresh IDBFactory so object stores don't bleed between tests
    currentFactory = new IDBFactory()
    return new IDBTimelineDatabase()
}

describe('IDBTimelineDatabase.batchSave', () => {
    test('saves new ticks', async () => {
        const db = freshDb()
        const tick: timer.timeline.Tick = { host: 'a.com', start: 1000, duration: 500 }
        await db.batchSave([tick])
        const result = await db.select()
        expect(result).toHaveLength(1)
        expect(result[0]).toEqual(tick)
    })

    test('skips conflicting ticks (new start overlaps existing interval)', async () => {
        const db = freshDb()
        const existing: timer.timeline.Tick = { host: 'a.com', start: 1000, duration: 500 }
        await db.batchSave([existing])
        // start=1200 is inside [1000, 1500) → conflict
        const conflict: timer.timeline.Tick = { host: 'a.com', start: 1200, duration: 100 }
        await db.batchSave([conflict])
        const result = await db.select()
        expect(result).toHaveLength(1)
        expect(result[0]).toEqual(existing)
    })

    test('merges ticks that start within MERGE_THRESHOLD (1 s) of an existing tick start', async () => {
        const db = freshDb()
        const existing: timer.timeline.Tick = { host: 'a.com', start: 1000, duration: 500 }
        await db.batchSave([existing])
        // start=1000+800=1800 is within 1 s of existStart(1000)? No — canMerge checks start <= existStart + 1000.
        // Here existStart=1000, MERGE_THRESHOLD=1000 ms, so start must be <= 2000 and >= 1000.
        const nearby: timer.timeline.Tick = { host: 'a.com', start: 1800, duration: 200 }
        await db.batchSave([nearby])
        const result = await db.select()
        // Should be merged into one tick
        expect(result).toHaveLength(1)
        const merged = result[0]
        expect(merged.host).toBe('a.com')
        expect(merged.start).toBe(Math.min(existing.start, nearby.start))
        const expectedEnd = Math.max(existing.start + existing.duration, nearby.start + nearby.duration)
        expect(merged.start + merged.duration).toBe(expectedEnd)
    })

    test('ticks for different hosts are independent (no cross-host merge/conflict)', async () => {
        const db = freshDb()
        const a: timer.timeline.Tick = { host: 'a.com', start: 1000, duration: 500 }
        const b: timer.timeline.Tick = { host: 'b.com', start: 1200, duration: 100 }
        await db.batchSave([a, b])
        const result = await db.select()
        expect(result).toHaveLength(2)
    })

    test('handles empty tick list without error', async () => {
        const db = freshDb()
        await expect(db.batchSave([])).resolves.toBeUndefined()
        expect(await db.select()).toHaveLength(0)
    })
})

describe('IDBTimelineDatabase.select', () => {
    test('filters by start time', async () => {
        const db = freshDb()
        await db.batchSave([
            { host: 'a.com', start: 1000, duration: 100 },
            { host: 'a.com', start: 5000, duration: 100 },
        ])
        const result = await db.select({ start: 3000 })
        expect(result).toHaveLength(1)
        expect(result[0].start).toBe(5000)
    })

    test('filters by host', async () => {
        const db = freshDb()
        await db.batchSave([
            { host: 'a.com', start: 1000, duration: 100 },
            { host: 'b.com', start: 2000, duration: 100 },
        ])
        const result = await db.select({ host: 'a.com' })
        expect(result).toHaveLength(1)
        expect(result[0].host).toBe('a.com')
    })
})
