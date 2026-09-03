// fake-indexeddb keeps database connections alive as long as the worker process
// lives. When Rstest tears down jsdom, any pending IndexedDB task may touch the
// destroyed environment and throw NotFoundError, which makes the worker exit
// with code 1. Track every opened connection so we can close them before teardown.
const openConnections = new Set<IDBDatabase>()

const originalOpen = indexedDB.open.bind(indexedDB)
indexedDB.open = (name: string, version?: number): IDBOpenDBRequest => {
    const request = originalOpen(name, version)
    const originalOnSuccess = request.onsuccess
    request.onsuccess = event => {
        const db = request.result
        if (db) {
            openConnections.add(db)
            db.addEventListener('close', () => openConnections.delete(db))
        }
        originalOnSuccess?.call(request, event)
    }
    return request
}

// fake-indexeddb schedules its work via Node's setImmediate. Yield the event
// loop a few times in a row to drain pending tasks before/after closing connections.
async function drainPendingTasks(times = 5): Promise<void> {
    for (let i = 0; i < times; i++) {
        await new Promise<void>(resolve => setImmediate(resolve))
    }
}

beforeAll(() => {
    global.chrome = {
        runtime: {
            id: 'mock_runtime_id',
            getManifest: () => ({ manifest_version: 3, name: 'mock_manifest', version: 'foo.bar' }),
        } satisfies Pick<typeof chrome.runtime, 'id' | 'getManifest'>
    } as unknown as typeof global.chrome
})

afterAll(async () => {
    await drainPendingTasks()

    for (const db of Array.from(openConnections)) {
        try {
            db.close()
        } catch {
            // ignore
        }
    }
    openConnections.clear()

    // Allow close event handlers and any remaining fake-indexeddb tasks to drain
    // before jsdom is destroyed.
    await drainPendingTasks()
})

