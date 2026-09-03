/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CATE_NOT_SET_ID } from '@util/site'
import { BaseIDBStorage, iterateCursor, type Key, req2Promise, type Table } from './common/indexed-storage'

const INDEXES: (Key<tt4b.site.SiteInfo> | Key<tt4b.site.SiteInfo>[])[] = [
    'host',
    'type',
    ['host', 'type'],
] as const

type SiteIndex = typeof INDEXES[number]

type QueryPlan = {
    cursorReq: IDBRequest<IDBCursorWithValue | null>
    filter: (site: tt4b.site.SiteInfo) => boolean
}

class SiteDatabase extends BaseIDBStorage<tt4b.site.SiteInfo> {
    table: Table = 'site'
    key: SiteIndex = ['host', 'type']
    indexes: SiteIndex[] = INDEXES

    private buildQueryPlan(store: IDBObjectStore, condition?: tt4b.site.Query): QueryPlan {
        const { host: hostFilter, fuzzyQuery, cateIds, types } = condition ?? {}
        const cateFilter = typeof cateIds === 'number' ? [cateIds] : cateIds
        const typeFilter = typeof types === 'string' ? [types] : types
        const singleType = typeFilter?.length === 1 ? typeFilter[0] : undefined

        let coverage: Partial<Record<'host' | 'type', boolean>>
        let cursorReq: IDBRequest<IDBCursorWithValue | null>
        if (hostFilter && singleType) {
            cursorReq = super.assertIndex(store, ['host', 'type']).openCursor(IDBKeyRange.only([hostFilter, singleType]))
            coverage = { host: true, type: true }
        } else if (hostFilter) {
            cursorReq = super.assertIndex(store, 'host').openCursor(IDBKeyRange.only(hostFilter))
            coverage = { host: true }
        } else if (singleType) {
            cursorReq = super.assertIndex(store, 'type').openCursor(IDBKeyRange.only(singleType))
            coverage = { type: true }
        } else {
            cursorReq = store.openCursor()
            coverage = {}
        }
        const filter = (site: tt4b.site.SiteInfo) => {
            const { host, alias, cate, type } = site
            if (fuzzyQuery && !(host?.includes(fuzzyQuery) || alias?.includes(fuzzyQuery))) return false
            if (cateFilter?.length && (type !== 'normal' || !cateFilter.includes(cate ?? CATE_NOT_SET_ID))) return false
            if (!coverage.type && typeFilter?.length && !typeFilter.includes(type)) return false
            if (!coverage.host && hostFilter && hostFilter !== host) return false
            return true
        }

        return { cursorReq, filter }
    }

    async select(condition?: tt4b.site.Query): Promise<tt4b.site.SiteInfo[]> {
        return this.withStore(async store => {
            const { cursorReq, filter } = this.buildQueryPlan(store, condition)
            const rows = await iterateCursor<tt4b.site.SiteInfo>(cursorReq)
            return rows.filter(filter)
        }, 'readonly')
    }

    async get(key: tt4b.site.SiteKey): Promise<tt4b.site.SiteInfo | undefined> {
        return this.withStore(async store => {
            const index = super.assertIndex(store, ['host', 'type'])
            return await req2Promise<tt4b.site.SiteInfo>(index.get([key.host, key.type])) ?? undefined
        }, 'readonly')
    }

    async getBatch(keys: tt4b.site.SiteKey[]): Promise<tt4b.site.SiteInfo[]> {
        return this.withStore(async store => {
            const index = super.assertIndex(store, ['host', 'type'])
            const result: tt4b.site.SiteInfo[] = []
            for (const key of keys) {
                const row = await req2Promise<tt4b.site.SiteInfo>(index.get([key.host, key.type]))
                row && result.push(row)
            }
            return result
        }, 'readonly')
    }

    async save(...sites: tt4b.site.SiteInfo[]): Promise<void> {
        if (!sites.length) return
        await this.withStore(async store => {
            for (const site of sites) {
                await req2Promise(store.put(site))
            }
        }, 'readwrite')
    }

    async remove(siteKeys: tt4b.site.SiteKey[]): Promise<void> {
        if (!siteKeys.length) return
        await this.withStore(async store => {
            const index = super.assertIndex(store, ['host', 'type'])
            for (const key of siteKeys) {
                const id = await req2Promise(index.getKey([key.host, key.type]))
                if (id !== undefined) {
                    await req2Promise(store.delete(id))
                }
            }
        }, 'readwrite')
    }
}

const siteDatabase = new SiteDatabase()

export default siteDatabase