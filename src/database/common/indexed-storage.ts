const ALL_TABLES = ['stat', 'timeline'] as const

export type Table = typeof ALL_TABLES[number]

export type Key<T = Record<string, number>> = keyof T & string

type IndexConfig<T = Record<string, unknown>> = {
    key: Key<T> | Key<T>[]
    unique?: boolean
}

export type Index<T = Record<string, unknown>> = Key<T> | Key<T>[] | IndexConfig<T>

const DB_NAME = `tt4b_${chrome.runtime.id}`

function normalizeIndex<T = Record<string, number>>(index: Index<T>): IndexConfig<T> {
    return typeof index === 'string' || Array.isArray(index) ? { key: index } : index
}

function formatIdxName<T = Record<string, number>>(key: IndexConfig<T>['key']): string {
    const keyStr = Array.isArray(key) ? [...key].sort().join('_') : key
    return `idx_${keyStr}`
}

export function req2Promise<T = unknown>(req: IDBRequest<T>): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = (ev) => {
            console.error("Failed to request indexed-db", ev, req.error)
            reject(req.error)
        }
    })
}

export async function iterateCursor<T = unknown>(
    req: IDBRequest<IDBCursorWithValue | null>
): Promise<readonly T[]>
export async function iterateCursor<T = unknown>(
    req: IDBRequest<IDBCursorWithValue | null>,
    processor: (cursor: IDBCursorWithValue) => void | Promise<void>
): Promise<void>

export async function iterateCursor<T = unknown>(
    req: IDBRequest<IDBCursorWithValue | null>,
    processor?: (cursor: IDBCursorWithValue) => void | Promise<void>
): Promise<readonly T[] | void> {
    const collectResults = !processor
    const results: T[] = []

    return new Promise((resolve, reject) => {
        req.onsuccess = async () => {
            const cursor = req.result
            if (!cursor) return resolve(collectResults ? results : undefined)

            try {
                collectResults && results.push(cursor.value as T)
                await processor?.(cursor)
                cursor.continue()
            } catch (error) {
                reject(error)
            }
        }

        req.onerror = () => reject(req.error)
    })
}

export abstract class BaseIDBStorage<T = Record<string, unknown>> {
    private db: IDBDatabase | undefined
    abstract indexes: Index<T>[]
    abstract key: Key<T> | Key<T>[]
    abstract table: Table

    protected async initDb(): Promise<IDBDatabase> {
        if (this.db) return this.db

        const factory = typeof window === 'undefined' ? self.indexedDB : window.indexedDB
        const checkRequest = factory.open(DB_NAME)

        return new Promise((resolve, reject) => {
            checkRequest.onsuccess = () => {
                const db = checkRequest.result
                const storeExisted = db.objectStoreNames.contains(this.table)
                const needUpgrade = !storeExisted || this.needUpgradeIndexes(db)

                if (!needUpgrade) {
                    this.db = db
                    return resolve(db)
                }

                const currentVersion = db.version
                db.close()

                const upgradeRequest = factory.open(DB_NAME, currentVersion + 1)

                upgradeRequest.onupgradeneeded = () => {
                    const upgradeDb = upgradeRequest.result
                    const transaction = upgradeRequest.transaction
                    if (!transaction) return reject("Failed to get transaction of upgrading request")

                    let store = upgradeDb.objectStoreNames.contains(this.table)
                        ? transaction.objectStore(this.table)
                        : upgradeDb.createObjectStore(this.table, { keyPath: this.key })
                    this.createIndexes(store)
                }

                upgradeRequest.onsuccess = () => {
                    console.log("IndexedDB upgraded")
                    this.db = upgradeRequest.result
                    resolve(upgradeRequest.result)
                }

                upgradeRequest.onerror = () => reject(upgradeRequest.error)
            }

            checkRequest.onerror = () => reject(checkRequest.error)
        })
    }

    private needUpgradeIndexes(db: IDBDatabase): boolean {
        try {
            const transaction = db.transaction(this.table, 'readonly')
            const store = transaction.objectStore(this.table)
            const indexNames = store.indexNames

            for (const index of this.indexes) {
                const { key } = normalizeIndex(index)
                const idxName = formatIdxName(key)
                if (!indexNames.contains(idxName)) {
                    return true
                }
            }
            return false
        } catch (e) {
            console.error("Failed to check indexes", e)
            return true
        }
    }

    private createIndexes(store: IDBObjectStore) {
        const existingIndexes = store.indexNames

        for (const index of this.indexes) {
            const { key, unique } = normalizeIndex(index)
            const idxName = formatIdxName(key)
            if (!existingIndexes.contains(idxName)) {
                store.createIndex(idxName, key, { unique })
            }
        }
    }

    protected async withStore<T = unknown>(operation: (store: IDBObjectStore) => T | Promise<T>, mode?: IDBTransactionMode): Promise<T> {
        const db = await this.initDb()
        const trans = db.transaction(this.table, mode ?? 'readwrite')
        try {
            const store = trans.objectStore(this.table)
            const result = await operation(store)
            // Waiting for transaction completed
            await new Promise<void>((resolve, reject) => {
                trans.oncomplete = () => resolve()
                trans.onerror = () => reject(trans.error)
                trans.onabort = () => reject(new Error('Transaction aborted'))
            })
            return result
        } catch (e) {
            console.error("Failed to process with transaction", e)
            if (!trans.error && trans.mode !== 'readonly') {
                try {
                    trans.abort()
                } catch (ignored) { }
            }
            throw e
        }
    }

    protected assertIndex(store: IDBObjectStore, key: Key<T> | Key<T>[]): IDBIndex {
        const idxName = formatIdxName(key)
        try {
            return store.index(idxName)
        } catch (err) {
            console.error(`Failed to query index: table=${this.table}`, err)
            throw err
        }
    }
}
