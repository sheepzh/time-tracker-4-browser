/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listTabs, sendMsg2Tab } from "@api/chrome/tab"
import siteDatabase from "@db/site-database"
import { ALL_HOSTS as ALL_FILE_HOSTS, MERGED_HOST as MERGED_FILE_HOST } from '@util/constant/remain-host'
import { extractHostname, isValidVirtualHost, judgeVirtualFast } from "@util/pattern"
import { SiteMap, supportCategory } from "@util/site"
import { toUnicode as punyCode2Unicode } from "punycode"
import mergeRuleDatabase from '../database/merge-rule-database'
import statDatabase from '../database/stat-database'
import { getPslSuffix } from '../psl'
import CustomizedHostMergeRuler from './components/host-merge-ruler'
import { slicePageResult } from "./components/page-info"
import virtualSiteHolder from './components/virtual-site-holder'

export async function saveAlias(key: timer.site.SiteKey, alias: string | undefined, noRewrite?: boolean) {
    const exist = await siteDatabase.get(key)
    if (exist && noRewrite) return
    await siteDatabase.save({ ...exist, ...key, alias })
}

export async function removeIconUrl(key: timer.site.SiteKey) {
    const exist = await siteDatabase.get(key)
    if (!exist) return
    delete exist.iconUrl
    await siteDatabase.save(exist)
}

export async function saveIconUrl(key: timer.site.SiteKey, iconUrl: string) {
    const exist = await siteDatabase.get(key)
    await siteDatabase.save({ ...exist, ...key, iconUrl })
}

export async function saveSiteRunState(key: timer.site.SiteKey, enabled: boolean) {
    const exist = await siteDatabase.get(key)
    if (!exist) return
    exist.run = enabled
    await siteDatabase.save(exist)
    // send msg to tabs
    const tabs = await listTabs()
    for (const { id } of tabs) {
        try {
            id && await sendMsg2Tab(id, 'siteRunChange')
        } catch { }
    }
}

export async function addSite(siteInfo: timer.site.SiteInfo): Promise<string | undefined> {
    if (await siteDatabase.exist(siteInfo)) {
        return 'Site already exists'
    }
    if (!supportCategory(siteInfo)) siteInfo.cate = undefined
    await siteDatabase.save(siteInfo)
    virtualSiteHolder.buildWith(siteInfo)
}

export async function removeSites(keys: timer.site.SiteKey[]): Promise<void> {
    await siteDatabase.remove(keys)
    keys.forEach(key => virtualSiteHolder.onDeleted(key))
}

export async function selectSitePage(param?: timer.site.PageQuery): Promise<timer.common.PageResult<timer.site.SiteInfo>> {
    const origin = await siteDatabase.select(param)
    return slicePageResult(origin, param)
}

export async function batchChangeCate(cateId: number | undefined, keys: timer.site.SiteKey[]): Promise<void> {
    keys = keys?.filter(supportCategory)
    if (!keys?.length) return

    const sites = await siteDatabase.getBatch(keys)
    const siteMap = SiteMap.identify(sites)
    const toSave = keys.map(k => ({ ...siteMap.get(k), ...k, cate: cateId }))
    await siteDatabase.save(...toSave)
}

/**
 * @since 0.9.0
 */
export async function getSite(siteKey: timer.site.SiteKey): Promise<timer.site.SiteInfo> {
    const info = await siteDatabase.get(siteKey)
    return info ?? siteKey
}

function moveToFront<T>(arr: T[], idx: number): T[] {
    const item = arr[idx]
    if (item === undefined) return arr
    return [item, ...arr.slice(0, idx), ...arr.slice(idx + 1)]
}

export async function searchSites(query: string | undefined): Promise<timer.site.SiteInfo[]> {
    query = cleanSearchQuery(query)
    const filter = query ? (host: string) => host.includes(query) : () => true
    const [normal, merged] = await listHosts(filter)

    const keys: timer.site.SiteKey[] = []
    normal.forEach(host => keys.push({ host, type: 'normal' }))
    merged.forEach(host => keys.push({ host, type: 'merged' }))

    ALL_FILE_HOSTS.forEach(fileHost => filter(fileHost) && keys.push({ host: fileHost, type: 'normal' }))
    filter(MERGED_FILE_HOST) && keys.push({ host: MERGED_FILE_HOST, type: 'merged' })

    const fromDb = await siteDatabase.getBatch(keys)
    const siteMap = SiteMap.identify(fromDb)
    const rows = keys.map(k => ({ ...siteMap.get(k), ...k }))
    const ranked = [...rows.filter(r => !r.alias), ...rows.filter(r => r.alias)]

    const hitIdx = ranked.findIndex(r => r.host === query)
    if (hitIdx >= 0) return moveToFront(ranked, hitIdx)
    if (!query) return ranked

    if (judgeVirtualFast(query) && isValidVirtualHost(query)) {
        return [{ host: query, type: 'virtual' }, ...ranked]
    }

    const { host } = extractHostname(query)
    const hostIdx = ranked.findIndex(r => r.host === host)
    if (hostIdx >= 0) return moveToFront(ranked, hostIdx)

    return [{ host, type: 'normal' }, ...ranked]
}

function cleanSearchQuery(query: string | undefined): string | undefined {
    query = query?.trim?.()
    if (!query) return undefined
    try {
        // Remove protocol and search params, only keep host and path for search
        const u = new URL(query)
        query = u.host + u.pathname
    } catch { }
    if (query.endsWith('/')) query += '**'
    return query
}

/**
 * Query hosts from stat databases
 *
 * @param query the part of host
 * @since 0.0.8
 */
async function listHosts(filter: (host: string) => boolean): Promise<[normal: string[], merged: string[]]> {
    const rows = await statDatabase.select({ virtual: false })
    const hosts = new Set(rows.map(row => row.host))

    const mergeRuleItems = await mergeRuleDatabase.selectAll()
    const mergeRuler = new CustomizedHostMergeRuler(mergeRuleItems)

    const normal = new Set<string>()
    const merged = new Set<string>()

    hosts.forEach(host => {
        filter(host) && normal.add(host)
        const mergedHost = mergeRuler.merge(host)
        filter(mergedHost) && merged.add(mergedHost)
    })

    return [Array.from(normal), Array.from(merged)]
}

export async function fillInitialAlias(keys: timer.site.SiteKey[]) {
    const sites = await siteDatabase.getBatch(keys)
    const toSave = new SiteMap<string>()
    sites.forEach(site => {
        if (site.alias) return
        const alias = getInitialAlias(site.host)
        alias && toSave.put(site, alias)
    })
    await batchSaveAlias(toSave)
}

export function getInitialAlias(host: string): string | undefined {
    let parts = host.split('.')
    if (parts.length < 2) return

    const suffix = getPslSuffix(host)
    const prefix = host.replace(`.${suffix}`, '').replace(/^www\./, '')
    parts = prefix.split('.')
    return parts.reverse().map(cvt2Alias).join(' ')
}

function cvt2Alias(part: string): string {
    try {
        part = punyCode2Unicode(part)
    } catch {
    }
    return part.charAt(0).toUpperCase() + part.slice(1)
}

async function batchSaveAlias(siteMap: SiteMap<string>): Promise<void> {
    if (!siteMap.count()) return
    const allSites = await siteDatabase.getBatch(siteMap.keys())
    const existMap = SiteMap.identify(allSites)

    const toSave: timer.site.SiteInfo[] = []
    siteMap.forEach((k, alias) => {
        const exist = existMap.get(k)
        if (exist?.alias) return
        toSave.push({ ...exist ?? k, alias })
    })
    await siteDatabase.save(...toSave)
}