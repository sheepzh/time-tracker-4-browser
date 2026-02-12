/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CATE_NOT_SET_ID } from "@util/site"
import BaseDatabase from "./common/base-database"
import { REMAIN_WORD_PREFIX } from "./common/constant"

export type SiteCondition = {
    /**
     * Fuzzy query of host or alias
     */
    fuzzyQuery?: string
    /**
     * @since 3.0.0
     */
    cateIds?: number | number[]
    types?: timer.site.Type | timer.site.Type[]
}

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
    if (type === 'virtual') {
        return VIRTUAL_KEY_PREFIX + host
    } else if (type === 'merged') {
        return HOST_KEY_PREFIX + MERGED_FLAG + host
    } else {
        return HOST_KEY_PREFIX + '_' + host
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
    const { a, i, c, r } = entry || {}
    const siteInfo: timer.site.SiteInfo = { ...key }
    siteInfo.alias = a
    siteInfo.cate = c ?? CATE_NOT_SET_ID
    siteInfo.iconUrl = i
    siteInfo.run = !!r
    return siteInfo
}

////////////////////////////////////////////////////////////////////////////
/////////////////////////                          /////////////////////////
/////////////////////////   PUBLIC METHODS START   /////////////////////////
/////////////////////////                          /////////////////////////
////////////////////////////////////////////////////////////////////////////

/**
 * Select by condition
 *
 * @returns list not be undefined, maybe empty
 */
async function select(this: SiteDatabase, condition?: SiteCondition): Promise<timer.site.SiteInfo[]> {
    const filter = buildFilter(condition)
    const data = await this.storage.get()
    return Object.entries(data)
        .filter(([key]) => key.startsWith(DB_KEY_PREFIX))
        .map(([key, value]) => cvt2SiteInfo(cvt2SiteKey(key), value as _Entry))
        .filter(filter)
}

function buildFilter(condition?: SiteCondition): (site: timer.site.SiteInfo) => boolean {
    const { fuzzyQuery, cateIds, types } = condition || {}
    let cateFilter = typeof cateIds === 'number' ? [cateIds] : (cateIds?.length ? cateIds : undefined)
    let typeFilter = typeof types === 'string' ? [types] : (types?.length ? types : undefined)
    return site => {
        const { host: siteHost, alias: siteAlias, cate, type } = site || {}
        if (fuzzyQuery && !(siteHost?.includes(fuzzyQuery) || siteAlias?.includes(fuzzyQuery))) return false
        if (cateFilter && (!cateFilter.includes(cate ?? CATE_NOT_SET_ID) || type !== 'normal')) return false
        if (typeFilter && !matchType(typeFilter, site)) return false
        return true
    }
}

function matchType(types: timer.site.Type[], site: timer.site.SiteInfo): boolean {
    const { type } = site || {}
    if (type === 'virtual') {
        return types.includes('virtual')
    } else if (type === 'merged') {
        return types.includes('merged')
    } else {
        return types.includes('normal')
    }
}

/**
 * Get by key
 *
 * @returns site info, or undefined
 */
async function get(this: SiteDatabase, key: timer.site.SiteKey): Promise<timer.site.SiteInfo | null> {
    const entry = await this.storage.getOne<_Entry>(cvt2Key(key))
    return entry ? cvt2SiteInfo(key, entry) : null
}

async function getBatch(this: SiteDatabase, keys: timer.site.SiteKey[]): Promise<timer.site.SiteInfo[]> {
    const result = await this.storage.get(keys.map(cvt2Key))
    return Object.entries(result)
        .map(([key, value]) => cvt2SiteInfo(cvt2SiteKey(key), value as _Entry))
}

/**
 * Save site info
 */
async function save(this: SiteDatabase, ...sites: timer.site.SiteInfo[]): Promise<void> {
    if (!sites?.length) return
    const toSet: Record<string, _Entry> = {}
    sites?.forEach(s => toSet[cvt2Key(s)] = cvt2Entry(s))
    await this.storage.set(toSet)
}

async function remove(this: SiteDatabase, ...siteKeys: timer.site.SiteKey[]): Promise<void> {
    const keys = siteKeys?.map(s => cvt2Key(s))
    if (!keys?.length) return
    await this.storage.remove(keys)
}

async function exist(this: SiteDatabase, siteKey: timer.site.SiteKey): Promise<boolean> {
    const key = cvt2Key(siteKey)
    const entry = await this.storage.getOne<_Entry>(key)
    return !!entry
}

async function existBatch(this: SiteDatabase, siteKeys: timer.site.SiteKey[]): Promise<timer.site.SiteKey[]> {
    const keys = siteKeys.map(cvt2Key)
    const items = await this.storage.get(keys)
    return Object.entries(items).map(([key]) => cvt2SiteKey(key))
}


////////////////////////////////////////////////////////////////////////////
/////////////////////////                          /////////////////////////
/////////////////////////    PUBLIC METHODS END    /////////////////////////
/////////////////////////                          /////////////////////////
////////////////////////////////////////////////////////////////////////////

class SiteDatabase extends BaseDatabase {
    select = select
    get = get
    getBatch = getBatch
    save = save
    remove = remove
    exist = exist
    existBatch = existBatch

    /**
     * Add listener to listen changes
     *
     * @since 1.6.0
     */
    addChangeListener(listener: (oldAndNew: [timer.site.SiteInfo?, timer.site.SiteInfo?][]) => void) {
        const storageListener = (
            changes: { [key: string]: chrome.storage.StorageChange },
            _areaName: chrome.storage.AreaName,
        ) => {
            const changedSites: [timer.site.SiteInfo?, timer.site.SiteInfo?][] = Object.entries(changes)
                .filter(([k]) => k.startsWith(DB_KEY_PREFIX))
                .map(([k, { oldValue, newValue }]) => {
                    const siteKey = cvt2SiteKey(k)
                    const oldVal = oldValue ? cvt2SiteInfo(siteKey, oldValue as _Entry) : undefined
                    const newVal = newValue ? cvt2SiteInfo(siteKey, newValue as _Entry) : undefined
                    return [oldVal, newVal]
                })
            changedSites.length && listener?.(changedSites)
        }
        chrome.storage.onChanged.addListener(storageListener)
    }
}

const siteDatabase = new SiteDatabase()

export default siteDatabase