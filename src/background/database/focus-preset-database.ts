import { BaseIDBStorage, iterateCursor, req2Promise, type Index, type Key, type Table } from './common/indexed-storage'

class FocusPresetDatabase extends BaseIDBStorage<tt4b.focus.Preset> {
    indexes: Index<tt4b.focus.Preset>[] = []
    key: Key<tt4b.focus.Preset> = 'id'
    table: Table = 'focus_preset'

    async add(preset: Omit<tt4b.focus.Preset, 'id'>): Promise<number> {
        return this.withStore(async store => {
            const id = Date.now()
            const req = store.add({ ...preset, id } satisfies tt4b.focus.Preset)
            await req2Promise<IDBValidKey>(req)
            return id
        })
    }

    async update(preset: tt4b.focus.Preset): Promise<void> {
        return this.withStore(async store => void store.put(preset))
    }

    async remove(id: number): Promise<void> {
        return this.withStore(async store => void store.delete(id))
    }

    async getById(id: number): Promise<tt4b.focus.Preset | undefined> {
        return this.withStore(async store => {
            const req = store.get(id)
            return await req2Promise<tt4b.focus.Preset>(req)
        }, 'readonly')
    }

    async listAll(): Promise<tt4b.focus.Preset[]> {
        return this.withStore(async store => {
            const req = store.openCursor()
            return await iterateCursor<tt4b.focus.Preset>(req) as tt4b.focus.Preset[]
        }, 'readonly')
    }
}

const focusPresetDatabase = new FocusPresetDatabase()

export default focusPresetDatabase
