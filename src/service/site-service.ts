/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listTabs, sendMsg2Tab } from "@api/chrome/tab"
import siteDatabase, { type SiteCondition } from "@db/site-database"
import { toMap } from "@util/array"
import { identifySiteKey, SiteMap, supportCategory } from "@util/site"
import { slicePageResult } from "./components/page-info"

export type SiteQueryParam = SiteCondition

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

export async function addSite(siteInfo: timer.site.SiteInfo): Promise<void> {
    if (await siteDatabase.exist(siteInfo)) {
        return
    }
    if (!supportCategory(siteInfo)) siteInfo.cate = undefined
    await siteDatabase.save(siteInfo)
}

export async function selectSitePage(param?: SiteQueryParam, page?: timer.common.PageQuery): Promise<timer.common.PageResult<timer.site.SiteInfo>> {
    const origin: timer.site.SiteInfo[] = await siteDatabase.select(param)
    const result: timer.common.PageResult<timer.site.SiteInfo> = slicePageResult(origin, page)
    return result
}

export function selectAllSites(param?: SiteQueryParam): Promise<timer.site.SiteInfo[]> {
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
