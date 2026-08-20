/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { CATE_NOT_SET_ID } from '@util/site'
import BaseDatabase from '../common/base-database'
import { REMAIN_WORD_PREFIX } from '../common/constant'

type SiteEntry = {
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
     * Run time
     */
    r?: boolean
}

const DB_KEY_PREFIX = REMAIN_WORD_PREFIX + 'SITE_'
const HOST_KEY_PREFIX = DB_KEY_PREFIX + 'h'
const VIRTUAL_KEY_PREFIX = DB_KEY_PREFIX + 'v'
const MERGED_FLAG = 'm'

function cvt2Key({ host, type }: tt4b.site.SiteKey): string {
    switch (type) {
        case 'virtual': return VIRTUAL_KEY_PREFIX + host
        case 'merged': return HOST_KEY_PREFIX + MERGED_FLAG + host
        case 'normal': return HOST_KEY_PREFIX + '_' + host
    }
}

function cvt2SiteKey(key: string): tt4b.site.SiteKey {
    if (key.startsWith(VIRTUAL_KEY_PREFIX)) {
        return {
            host: key.substring(VIRTUAL_KEY_PREFIX.length),
            type: 'virtual',
        }
    }
    if (key.startsWith(HOST_KEY_PREFIX)) {
        return {
            host: key.substring(HOST_KEY_PREFIX.length + 1),
            type: key.charAt(HOST_KEY_PREFIX.length) === MERGED_FLAG ? 'merged' : 'normal',
        }
    }
    return { host: key, type: 'normal' }
}

function cvt2SiteInfo(key: tt4b.site.SiteKey, entry: SiteEntry | undefined): tt4b.site.SiteInfo {
    const { a, i, c, r } = entry ?? {}
    const siteInfo: tt4b.site.SiteInfo = { ...key }
    siteInfo.alias = a
    siteInfo.cate = c ?? CATE_NOT_SET_ID
    siteInfo.iconUrl = i
    siteInfo.options = { run: r }
    return siteInfo
}

function isSiteKey(key: string): boolean {
    return key.startsWith(HOST_KEY_PREFIX) || key.startsWith(VIRTUAL_KEY_PREFIX)
}

/**
 * @deprecated Use IDBSiteDatabase instead, this will be removed in the future
 */
export class ClassicSiteDatabase extends BaseDatabase {
    async select(): Promise<tt4b.site.SiteInfo[]> {
        const data = await this.storage.get()
        return Object.entries(data)
            .filter(([key]) => isSiteKey(key))
            .map(([key, value]) => cvt2SiteInfo(cvt2SiteKey(key), value as SiteEntry))
    }

    async remove(siteKeys: tt4b.site.SiteKey[]): Promise<void> {
        if (!siteKeys.length) return
        await this.storage.remove(siteKeys.map(cvt2Key))
    }
}
