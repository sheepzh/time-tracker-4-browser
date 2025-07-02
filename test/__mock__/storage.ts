import StoragePromise from "@db/common/storage-promise"

let store: Record<string, any> = {}

function resolveOneKey(key: string, result: Record<string, any>) {
    const val = store[key]
    val !== undefined && (result[key] = val)
}

function resolveKey(key: string | Object | string[] | null) {
    if (key === null || key === undefined) {
        return store
    } else if (typeof key === 'string') {
        const result = {}
        resolveOneKey(key, result)
        return result
    } else if (Array.isArray(key)) {
        const result = {}
        key.forEach(curr => resolveOneKey(curr, result))
        return result
    } else if (typeof key === 'object') {
        return Object.keys(key).reduce<Record<string, any>>((acc, curr) => {
            acc[curr] = store[curr] ?? (key as any)[curr]
            return acc
        }, {})
    }
    throw new Error('Wrong key given')
}

const sync = {
    get: jest.fn((...args) => {
        let id: string | string[] | Object
        let cb: (result: {}) => void
        let result: {} = {}
        if (args.length === 1) {
            result = store
            cb = args[0]
        } else {
            id = args[0]
            result = resolveKey(id)
            cb = args[1]
        }
        cb?.(result)
    }),
    getBytesInUse: jest.fn(cb => cb && cb(0)),
    set: jest.fn((payload, cb) => {
        Object.keys(payload).forEach((key) => (store[key] = payload[key]))
        cb?.()
    }),
    remove: jest.fn((id, cb) => {
        const idType = typeof id
        const keys: string[] = idType === 'string' ? [id] : (Array.isArray(id) ? id : Object.keys(id))
        keys.forEach((key: string) => delete store[key])
        cb?.()
    }),
    clear: jest.fn(cb => {
        store = {}
        cb?.()
    })
} as unknown as chrome.storage.SyncStorageArea

const local = { ...sync, QUOTA_BYTES: 5 * 1024 * 1024 } as chrome.storage.LocalStorageArea

const managed = sync

const onChanged = {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn()
} as unknown as chrome.storage.StorageChangedEvent

export const mockStorage = () => {
    global.chrome = {
        storage: {
            local, sync, managed, onChanged,
            session: local,
            AccessLevel: {
                TRUSTED_AND_UNTRUSTED_CONTEXTS: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
                TRUSTED_CONTEXTS: "TRUSTED_CONTEXTS",
            },
        }
    } as unknown as typeof global.chrome
}

export const localPromise = new StoragePromise(local)