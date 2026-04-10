/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { toMap } from '@/util/array'
import { CATE_NOT_SET_ID } from "@util/site"
import BaseDatabase from "./common/base-database"
import { REMAIN_WORD_PREFIX } from "./common/constant"

type _Entry = {
    /**
     * Alias
     */
    a?: string
    /**
     * Icon url
     */
    i?: string
    /**
     * Category ID
     */
    c?: number
    /**
     * Count run time
     */
    r?: boolean
}

const DB_KEY_PREFIX = REMAIN_WORD_PREFIX + 'SITE_'
const HOST_KEY_PREFIX = DB_KEY_PREFIX + 'h'
const VIRTUAL_KEY_PREFIX = DB_KEY_PREFIX + 'v'
const MERGED_FLAG = 'm'

function cvt2Key({ host, type }: timer.site.SiteKey): string {
    switch (type) {
        case 'virtual': return VIRTUAL_KEY_PREFIX + host
        case 'merged': return HOST_KEY_PREFIX + MERGED_FLAG + host
        case 'normal': return HOST_KEY_PREFIX + '_' + host
    }
}

function cvt2SiteKey(key: string): timer.site.SiteKey {
    if (key.startsWith(VIRTUAL_KEY_PREFIX)) {
        return {
            host: key.substring(VIRTUAL_KEY_PREFIX.length),
            type: 'virtual',
        }
    } else if (key.startsWith(HOST_KEY_PREFIX)) {
        return {
            host: key.substring(HOST_KEY_PREFIX.length + 1),
            type: key.charAt(HOST_KEY_PREFIX.length) === MERGED_FLAG ? 'merged' : 'normal',
        }
    } else {
        // Can't go there
        return { host: key, type: 'normal' }
    }
}

function cvt2Entry({ alias, iconUrl, cate, run }: timer.site.SiteInfo): _Entry {
    const entry: _Entry = { i: iconUrl }
    alias && (entry.a = alias)
    cate && (entry.c = cate)
    run && (entry.r = true)
    entry.i = iconUrl
    return entry
}

function cvt2SiteInfo(key: timer.site.SiteKey, entry: _Entry | undefined): timer.site.SiteInfo {
    const { a, i, c, r } = entry ?? {}
    const siteInfo: timer.site.SiteInfo = { ...key }
    siteInfo.alias = a
    siteInfo.cate = c ?? CATE_NOT_SET_ID
    siteInfo.iconUrl = i
    siteInfo.run = !!r
    return siteInfo
}

function buildFilter(condition?: timer.site.Query): (site: timer.site.SiteInfo) => boolean {
    const { fuzzyQuery, cateIds, types } = condition || {}
    let cateFilter = typeof cateIds === 'number' ? [cateIds] : (cateIds?.length ? cateIds : undefined)
    let typeFilter = typeof types === 'string' ? [types] : (types?.length ? types : undefined)
    return site => {
        const { host: siteHost, alias: siteAlias, cate, type } = site || {}
        if (fuzzyQuery && !(siteHost?.includes(fuzzyQuery) || siteAlias?.includes(fuzzyQuery))) return false
        if (cateFilter && (!cateFilter.includes(cate ?? CATE_NOT_SET_ID) || type !== 'normal')) return false
        if (typeFilter && !typeFilter.includes(type)) return false
        return true
    }
}

class SiteDatabase extends BaseDatabase {
    async select(condition?: timer.site.Query): Promise<timer.site.SiteInfo[]> {
        const filter = buildFilter(condition)
        const data = await this.storage.get()
        return Object.entries(data)
            .filter(([key]) => key.startsWith(DB_KEY_PREFIX))
            .map(([key, value]) => cvt2SiteInfo(cvt2SiteKey(key), value as _Entry))
            .filter(filter)
    }

    /**
     * Get by key
     *
     * @returns site info, or undefined
     */
    async get(key: timer.site.SiteKey): Promise<timer.site.SiteInfo | undefined> {
        const entry = await this.storage.getOne<_Entry>(cvt2Key(key))
        return entry && cvt2SiteInfo(key, entry)
    }

    async getBatch(keys: timer.site.SiteKey[]): Promise<timer.site.SiteInfo[]> {
        const result = await this.storage.get(keys.map(cvt2Key))
        return Object.entries(result)
            .map(([key, value]) => cvt2SiteInfo(cvt2SiteKey(key), value as _Entry))
    }

    async save(...sites: timer.site.SiteInfo[]): Promise<void> {
        if (!sites.length) return
        const toSet = toMap(sites, cvt2Key, cvt2Entry)
        await this.storage.set(toSet)
    }

    async remove(siteKeys: timer.site.SiteKey[]): Promise<void> {
        if (!siteKeys.length) return
        const keys = siteKeys.map(cvt2Key)
        await this.storage.remove(keys)
    }

    async exist(siteKey: timer.site.SiteKey): Promise<boolean> {
        const key = cvt2Key(siteKey)
        const entry = await this.storage.getOne<_Entry>(key)
        return !!entry
    }
}

const siteDatabase = new SiteDatabase()

export default siteDatabase