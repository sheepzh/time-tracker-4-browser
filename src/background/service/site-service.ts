/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { ALL_HOSTS, MERGED_HOST } from '@/util/constant/remain-host'
import { listTabs, sendMsg2Tab } from "@api/chrome/tab"
import siteDatabase from "@db/site-database"
import { toMap } from "@util/array"
import { isValidVirtualHost, judgeVirtualFast } from "@util/pattern"
import { identifySiteKey, SiteMap, supportCategory } from "@util/site"
import { slicePageResult } from "./components/page-info"
import { listHosts as listStatHostsGrouped } from "./stat-service"

export async function removeAlias(key: timer.site.SiteKey) {
    const exist = await siteDatabase.get(key)
    if (!exist) return
    delete exist.alias
    await siteDatabase.save(exist)
}

export async function saveAlias(key: timer.site.SiteKey, alias: string, noRewrite?: boolean) {
    const exist = await siteDatabase.get(key)
    let toUpdate: timer.site.SiteInfo
    if (exist) {
        // Can't overwrite if alias is already existed
        if (exist.alias && noRewrite) return
        toUpdate = exist
        toUpdate.alias = alias
    } else {
        toUpdate = { ...key, alias }
    }
    await siteDatabase.save(toUpdate)
}

export async function batchSaveAliasNoRewrite(siteMap: SiteMap<string>): Promise<void> {
    if (!siteMap?.count?.()) return
    const allSites = await siteDatabase.getBatch(siteMap.keys())
    const existMap = new SiteMap<timer.site.SiteInfo>()
    allSites.forEach(exist => existMap.put(exist, exist))

    const toSave: timer.site.SiteInfo[] = []
    siteMap.forEach((k, alias) => {
        const exist = existMap.get(k)
        if (exist?.alias || !alias) return
        toSave.push({ ...exist || k, alias })
    })
    await siteDatabase.save(...toSave)
}

export async function removeIconUrl(key: timer.site.SiteKey) {
    const exist = await siteDatabase.get(key)
    if (!exist) return
    delete exist.iconUrl
    await siteDatabase.save(exist)
}

export async function saveIconUrl(key: timer.site.SiteKey, iconUrl: string) {
    const exist = await siteDatabase.get(key)
    let toUpdate: timer.site.SiteInfo
    if (exist) {
        toUpdate = { ...exist }
        toUpdate.iconUrl = iconUrl
    } else {
        toUpdate = { ...key, iconUrl }
    }
    await siteDatabase.save(toUpdate)
}

export async function saveSiteRunState(key: timer.site.SiteKey, run: boolean) {
    const exist = await siteDatabase.get(key)
    if (!exist) return
    exist.run = run
    await siteDatabase.save(exist)
    // send msg to tabs
    const tabs = await listTabs()
    for (const { id } of tabs) {
        try {
            id && await sendMsg2Tab(id, 'siteRunChange')
        } catch { }
    }
}

export async function addSite(siteInfo: timer.site.SiteInfo): Promise<timer.common.Result<void>> {
    if (await siteDatabase.exist(siteInfo)) {
        return { success: false, errorMsg: 'Site already exists' }
    }
    if (!supportCategory(siteInfo)) siteInfo.cate = undefined
    await siteDatabase.save(siteInfo)
    return { success: true, data: undefined }
}

export async function selectSitePage(param?: timer.site.PageQuery): Promise<timer.common.PageResult<timer.site.SiteInfo>> {
    const origin = await siteDatabase.select(param)
    return slicePageResult(origin, param)
}

export function selectAllSites(param?: timer.site.Query): Promise<timer.site.SiteInfo[]> {
    return siteDatabase.select(param)
}

export function batchGetSites(keys: timer.site.SiteKey[]): Promise<timer.site.SiteInfo[]> {
    return siteDatabase.getBatch(keys)
}

export function removeSites(...sites: timer.site.SiteKey[]): Promise<void> {
    return siteDatabase.remove(...sites)
}

export async function saveSiteCate(key: timer.site.SiteKey, cateId: number | undefined): Promise<void> {
    if (!supportCategory(key)) return

    const exist = await siteDatabase.get(key)
    await siteDatabase.save({ ...exist || key, cate: cateId })
}

export async function batchSaveSiteCate(cateId: number | undefined, keys: timer.site.SiteKey[]): Promise<void> {
    keys = keys?.filter(supportCategory)
    if (!keys?.length) return

    const allSites = await siteDatabase.getBatch(keys)
    const siteMap = toMap(allSites, identifySiteKey)

    const toSave = keys.map(k => {
        const s = siteMap[identifySiteKey(k)]
        return ({ ...s || k, cate: cateId })
    })
    await siteDatabase.save(...toSave)
}

/**
 * @since 0.9.0
 */
export async function getSite(siteKey: timer.site.SiteKey): Promise<timer.site.SiteInfo> {
    const info = await siteDatabase.get(siteKey)
    return info ?? siteKey
}

/**
 * `query === undefined`: all hosts from usage stats (normal, merged, virtual).
 * `query` string: site-manage picker — trim empty → []; else fuzzy stats + local hosts + DB rows.
 */
export async function searchHosts(rawQuery?: string): Promise<timer.site.SiteInfo[]> {
    if (rawQuery === undefined) {
        const grouped = await listStatHostsGrouped(undefined)
        const out: timer.site.SiteInfo[] = []
        for (const host of grouped.normal) out.push({ host, type: 'normal' })
        for (const host of grouped.merged) out.push({ host, type: 'merged' })
        for (const host of grouped.virtual) out.push({ host, type: 'virtual' })
        return out
    }

    const trimmed = rawQuery.trim()
    if (!trimmed) return []

    let query = trimmed
    try {
        const u = new URL(query)
        query = u.host + u.pathname
    } catch { /* partial input */ }
    if (query.endsWith('/')) query += '**'
    if (!query) return []

    const { normal, merged } = await listStatHostsGrouped(query)
    const keys: timer.site.SiteKey[] = [
        ...normal.map(host => ({ host, type: 'normal' as const })),
        ...merged.map(host => ({ host, type: 'merged' as const })),
    ]
    for (const host of ALL_HOSTS) {
        if (host.includes(query)) keys.push({ host, type: 'normal' })
    }
    if (MERGED_HOST.includes(query)) {
        keys.push({ host: MERGED_HOST, type: 'merged' })
    }

    const fromDb = await siteDatabase.getBatch(keys)
    const byId = new Map(fromDb.map(r => [identifySiteKey(r), r] as const))
    const rows = keys.map(k => {
        const hit = byId.get(identifySiteKey(k))
        return hit ? { ...hit } : { ...k }
    })
    const ranked = [...rows.filter(r => !r.alias), ...rows.filter(r => r.alias)]

    const hitIdx = ranked.findIndex(r => r.host === query)
    if (hitIdx >= 0) {
        const [hit] = ranked.splice(hitIdx, 1)
        return [hit, ...ranked]
    }
    if (judgeVirtualFast(query)) {
        return isValidVirtualHost(query)
            ? [{ host: query, type: 'virtual' }, ...ranked]
            : ranked
    }
    return [{ host: query, type: 'normal' }, ...ranked]
}
