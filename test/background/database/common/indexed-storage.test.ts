import { BaseIDBStorage, req2Promise, type Index } from '@db/common/indexed-storage'

type TestRow = {
    id: number
    name: string
    category: string
}

class TestStorage extends BaseIDBStorage<TestRow> {
    override key = 'id' as const
    override table = 'stat' as const
    override indexes: Index<TestRow>[]

    constructor(indexes: Index<TestRow>[]) {
        super()
        this.indexes = indexes
    }

    async getByCategory(category: string): Promise<TestRow | undefined> {
        return this.withStore(async store => {
            const index = super.assertIndex(store, 'category')
            return await req2Promise<TestRow>(index.get(category))
        })
    }

    async put(row: TestRow): Promise<void> {
        await this.withStore(store => req2Promise(store.put(row)), 'readwrite')
    }
}

const getDbName = () => `tt4b_${chrome.runtime.id}`

async function deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(getDbName())
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
        request.onblocked = () => reject(new Error('Database deletion blocked'))
    })
}

async function createOldSchema(): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(getDbName())
        request.onupgradeneeded = () => {
            const db = request.result
            if (db.objectStoreNames.contains('stat')) return
            db.createObjectStore('stat', { keyPath: 'id' })
        }
        request.onsuccess = () => {
            request.result.close()
            resolve()
        }
        request.onerror = () => reject(request.error)
    })
}

describe('indexed-storage', () => {
    beforeEach(() => deleteDatabase())

    test('create missing index when querying after schema change', async () => {
        await createOldSchema()

        const db = new TestStorage(['name', 'category'])
        await db.put({ id: 1, name: 'foo', category: 'bar' })

        const result = await db.getByCategory('bar')
        expect(result).toEqual({ id: 1, name: 'foo', category: 'bar' })
    })
})