const ALL_TABLES = ['stat', 'timeline'] as const

export type Table = typeof ALL_TABLES[number]

export type Key<T = Record<string, number>> = keyof T & string

type IndexConfig<T = Record<string, unknown>> = {
    key: Key<T> | Key<T>[]
    unique?: boolean
}

export type Index<T = Record<string, unknown>> = Key<T> | Key<T>[] | IndexConfig<T>

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

type TransactionError = 'Connection' | 'StoreNotFound' | 'Unknown'

const detectTransactionError = (err: unknown): TransactionError => {
    if (!(err instanceof DOMException)) {
        return 'Unknown'
    }
    if (err.name === 'InvalidStateError' || err.name === 'AbortError') {
        return 'Connection'
    }
    if (err.name === 'NotFoundError') {
        return 'StoreNotFound'
    }
    return 'Unknown'
}

export function closedRangeKey(lower: IDBValidKey | undefined, upper: IDBValidKey | undefined): IDBKeyRange | undefined {
    if (lower !== undefined && upper !== undefined) {
        if (lower > upper) {
            [lower, upper] = [upper, lower]
        }
        return IDBKeyRange.bound(lower, upper, false, false)
    } else if (lower !== undefined) {
        return IDBKeyRange.lowerBound(lower, false)
    } else if (upper !== undefined) {
        return IDBKeyRange.upperBound(upper, false)
    } else {
        return undefined
    }
}

export type IndexResult<FilterCoverage> = {
    cursorReq: IDBRequest<IDBCursorWithValue | null>
    coverage?: FilterCoverage
}

export abstract class BaseIDBStorage<T = Record<string, unknown>> {
    private DB_NAME = `tt4b_${chrome.runtime.id}` as const

    private db: IDBDatabase | undefined
    private static initPromises = new Map<string, Promise<IDBDatabase>>()

    abstract indexes: Index<T>[]
    abstract key: Key<T> | Key<T>[]
    abstract table: Table

    protected async initDb(): Promise<IDBDatabase> {
        if (this.db) return this.db

        let initPromise = BaseIDBStorage.initPromises.get(this.table)
        if (!initPromise) {
            initPromise = this.doInitDb()
            BaseIDBStorage.initPromises.set(this.table, initPromise)
        }

        try {
            this.db = await initPromise
            this.setupDbCloseHandler(this.db)
            return this.db
        } catch (error) {
            BaseIDBStorage.initPromises.delete(this.table)
            throw error
        }
    }

    private setupDbCloseHandler(db: IDBDatabase): void {
        db.onclose = () => {
            if (this.db !== db) return

            this.db = undefined
            BaseIDBStorage.initPromises.delete(this.table)
        }
    }

    private async doInitDb(): Promise<IDBDatabase> {
        const factory = typeof window !== 'undefined' ? window.indexedDB : globalThis.indexedDB

        const checkDb = await new Promise<IDBDatabase>((resolve, reject) => {
            const checkRequest = factory.open(this.DB_NAME)
            checkRequest.onsuccess = () => resolve(checkRequest.result)
            checkRequest.onerror = () => reject(checkRequest.error || new Error("Failed to open database"))
        })

        return checkDb
    }

    // Only used for testing, be careful when using in production
    public async clear(): Promise<void> {
        await this.withStore(store => store.clear(), 'readwrite')
    }

    async upgrade(): Promise<void> {
        const factory = typeof window !== 'undefined' ? window.indexedDB : globalThis.indexedDB

        const checkDb = await new Promise<IDBDatabase>((resolve, reject) => {
            const checkRequest = factory.open(this.DB_NAME)
            checkRequest.onsuccess = () => resolve(checkRequest.result)
            checkRequest.onerror = () => reject(checkRequest.error || new Error("Failed to open database"))
            checkRequest.onblocked = () => {
                console.warn(`Database check blocked for "${this.table}" (DB: ${this.DB_NAME}), waiting for other connections to close`)
            }
        })

        const storeExisted = checkDb.objectStoreNames.contains(this.table)
        const needUpgrade = !storeExisted || this.needUpgradeIndexes(checkDb)

        if (!needUpgrade) {
            checkDb.close()
            return
        }

        const currentVersion = checkDb.version
        checkDb.close()

        return new Promise<void>((resolve, reject) => {
            const upgradeRequest = factory.open(this.DB_NAME, currentVersion + 1)

            upgradeRequest.onupgradeneeded = () => {
                try {
                    const upgradeDb = upgradeRequest.result
                    const transaction = upgradeRequest.transaction
                    if (!transaction) {
                        reject(new Error("Failed to get transaction of upgrading request"))
                        return
                    }

                    transaction.onerror = () => {
                        reject(transaction.error || new Error("Transaction failed"))
                    }

                    transaction.onabort = () => {
                        reject(new Error("Upgrade transaction was aborted"))
                    }

                    let store = upgradeDb.objectStoreNames.contains(this.table)
                        ? transaction.objectStore(this.table)
                        : upgradeDb.createObjectStore(this.table, { keyPath: this.key as string | string[] })
                    this.createIndexes(store)
                } catch (error) {
                    console.error("Failed to upgrade database in onupgradeneeded", error)
                    upgradeRequest.transaction?.abort()
                    reject(error instanceof Error ? error : new Error(String(error)))
                }
            }

            upgradeRequest.onsuccess = () => {
                console.log(`IndexedDB upgraded for table "${this.table}"`)
                upgradeRequest.result.close()
                resolve()
            }

            upgradeRequest.onerror = (event) => {
                console.error("Failed to upgrade database", event, upgradeRequest.error)
                reject(upgradeRequest.error || new Error("Failed to upgrade database"))
            }

            upgradeRequest.onblocked = () => {
                const blockingTables = Array.from(BaseIDBStorage.initPromises.keys())
                    .filter(table => table !== this.table)
                console.warn(
                    `Database upgrade blocked for table "${this.table}" (DB: ${this.DB_NAME}), ` +
                    `waiting for other connections to close. ` +
                    `Other tables with active connections: ${blockingTables.length > 0 ? blockingTables.join(', ') : 'none'}`
                )
            }
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
        let db = await this.initDb()

        for (let retryCount = 0; retryCount < 2; retryCount++) {
            let trans: IDBTransaction | undefined
            try {
                trans = db.transaction(this.table, mode ?? 'readwrite')
                const store = trans.objectStore(this.table)
                const result = await operation(store)
                const transaction = trans
                await new Promise<void>((resolve, reject) => {
                    transaction.oncomplete = () => resolve()
                    transaction.onerror = () => reject(transaction.error)
                    transaction.onabort = () => reject(new Error('Transaction aborted'))
                })
                return result
            } catch (e) {
                const errorType = detectTransactionError(e)

                if (errorType === 'Unknown') {
                    console.error("Failed to process with transaction", e)
                    if (trans && !trans.error && trans.mode !== 'readonly') {
                        try {
                            trans.abort()
                        } catch (ignored) { }
                    }
                    throw e
                }

                if (errorType === 'StoreNotFound') {
                    this.db?.close()
                    await this.upgrade()
                }

                this.db = undefined
                BaseIDBStorage.initPromises.delete(this.table)
                db = await this.initDb()
            }
        }
        throw new Error("Max retries exceeded")
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

    protected assertIndexCursor(store: IDBObjectStore, key: Key<T> | Key<T>[], range: IDBKeyRange): IDBRequest<IDBCursorWithValue | null> {
        const index = this.assertIndex(store, key)
        return index.openCursor(range)
    }
}
