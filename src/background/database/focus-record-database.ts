import {
    BaseIDBStorage, closedRangeKey, iterateCursor, req2Promise, type Index, type Key, type Table,
} from './common/indexed-storage'

type Condition = {
    state?: Arrayable<tt4b.focus.State>
    start?: number
    end?: number
}

class FocusRecordDatabase extends BaseIDBStorage<tt4b.focus.Session> {
    indexes: Index<tt4b.focus.Session>[] = ['end', 'state']
    key: Key<tt4b.focus.Session> = 'start'
    table: Table = 'focus_record'

    async add(record: tt4b.focus.Session): Promise<void> {
        return this.withStore(async store => {
            const req = store.add(record)
            await req2Promise<IDBValidKey>(req)
        })
    }

    async save(record: tt4b.focus.Session): Promise<void> {
        return this.withStore(async store => void store.put(record))
    }

    async list(condition?: Condition): Promise<tt4b.focus.Session[]> {
        return this.withStore(async store => {
            const { state, start, end } = condition ?? {}
            const states = state ? (Array.isArray(state) ? state : [state]) : undefined

            // If only state filter, use state index
            if (states && !start && !end) {
                const index = this.assertIndex(store, 'state')
                if (states.length === 1) {
                    const req = index.openCursor(IDBKeyRange.only(states[0]))
                    return await iterateCursor<tt4b.focus.Session>(req) as tt4b.focus.Session[]
                }
                // Multiple states: iterate all and filter
                const req = index.openCursor()
                const rows = await iterateCursor<tt4b.focus.Session>(req) as tt4b.focus.Session[]
                return rows.filter(row => states.includes(row.state))
            }

            // If time range filter, use start index
            if (start || end) {
                const range = closedRangeKey(start, end)
                const index = this.assertIndex(store, 'start')
                const req = index.openCursor(range)
                const rows = await iterateCursor<tt4b.focus.Session>(req) as tt4b.focus.Session[]
                return states ? rows.filter(row => states.includes(row.state)) : rows
            }

            // No condition, return all
            const req = store.openCursor()
            return await iterateCursor<tt4b.focus.Session>(req) as tt4b.focus.Session[]
        }, 'readonly')
    }
}

const focusRecordDatabase = new FocusRecordDatabase()

export default focusRecordDatabase
