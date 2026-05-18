/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listAllGroups } from "@api/chrome/tabGroups"
import cateDatabase from "@db/cate-database"
import siteDatabase from "@db/site-database"
import statDatabase, { type StatCondition } from "@db/stat-database"
import { toMap } from "@util/array"
import { CATE_NOT_SET_ID, distinctSites, SiteMap } from "@util/site"
import { isGroup, isSite } from "@util/stat"
import { slicePageResult } from "../components/page-info"
import { cvt2SiteRow } from "./common"
import { mergeCate } from "./merge/cate"
import { mergeDate } from "./merge/date"
import { mergeHost } from "./merge/host"
import { processRemote } from "./remote"

function extractAllSiteKeys(rows: tt4b.stat.SiteRow[], container: tt4b.site.SiteKey[]) {
    rows.forEach(row => {
        const { mergedRows } = row
        container.push(row.siteKey)
        mergedRows?.length && extractAllSiteKeys(mergedRows, container)
    })
}

function fillRowWithSiteInfo(row: tt4b.stat.SiteRow, siteMap: SiteMap<tt4b.site.SiteInfo>): void {
    if (!isSite(row)) return
    const { siteKey, mergedRows } = row

    mergedRows?.map(m => fillRowWithSiteInfo(m, siteMap))
    const siteInfo = siteMap.get(siteKey)
    if (siteInfo) {
        const { cate, iconUrl, alias } = siteInfo
        row.cateId = cate
        row.alias = alias
        row.iconUrl = iconUrl
    }
}

function compareSortVal(a: string | number, b: string | number, direction?: tt4b.common.SortDirection): number {
    if (a === b) return 0
    const val = a > b ? 1 : -1
    return direction === 'DESC' ? -val : val
}

function filterByCateId(itemCateId: number | undefined, cateIds: number[] | undefined): boolean {
    if (!cateIds?.length) return true
    return cateIds.includes(itemCateId ?? CATE_NOT_SET_ID)
}

export async function countSite(param?: tt4b.stat.SiteQuery): Promise<number> {
    const rows = await statDatabase.select(param)
    return rows.length
}

export async function selectSite(param?: tt4b.stat.SiteQuery): Promise<tt4b.stat.SiteRow[]> {
    const {
        mergeHost: needMerge, mergeDate: needMergeDate,
        date, query, host, cateIds,
        timeRange, focusRange,
        virtual, ignoreSite, inclusiveRemote,
        sortKey, sortDirection,
    } = param ?? {}

    const condition: StatCondition = {
        date, timeRange, focusRange, virtual,
        keys: host && !needMerge ? host : undefined,
    }
    let origin = await statDatabase.select(condition)
    let siteRows = origin.map(cvt2SiteRow)
    inclusiveRemote && (siteRows = await processRemote(siteRows, param))

    // Merge with rules
    needMerge && (siteRows = await mergeHost(siteRows))
    // Fill site info
    if (!ignoreSite || query) await fillSite(siteRows)
    // Filter
    siteRows = siteRows
        .filter(({ siteKey: { host: siteHost } }) => !host || host === siteHost)
        .filter(({ siteKey: { host: siteHost }, alias }) => !query || siteHost.includes(query) || !!alias?.includes(query))
        .filter(({ cateId }) => filterByCateId(cateId, cateIds))
    // Merge by date
    needMergeDate && (siteRows = mergeDate(siteRows))
    // Sort
    if (sortKey) {
        const sortVal = (a: tt4b.stat.SiteRow) => sortKey === 'host' ? a.siteKey.host : a[sortKey] ?? 0
        siteRows.sort((a, b) => compareSortVal(sortVal(a), sortVal(b), sortDirection))
    }
    return siteRows
}

export async function selectSitePage(param?: tt4b.stat.SitePageQuery): Promise<tt4b.common.PageResult<tt4b.stat.SiteRow>> {
    const rows = await selectSite(param)
    return slicePageResult(rows, param)
}

export async function selectCate(param?: tt4b.stat.CateQuery): Promise<tt4b.stat.CateRow[]> {
    const {
        mergeDate: needMergeDate,
        date, query, cateIds,
        inclusiveRemote,
        sortKey, sortDirection,
    } = param ?? {}

    let origin = await statDatabase.select({ date })

    let siteRows = origin.map(cvt2SiteRow)
    inclusiveRemote && (siteRows = await processRemote(siteRows, param))

    // Fill site info
    await fillSite(siteRows)
    // Merge sites by date first
    if (needMergeDate) siteRows = mergeDate(siteRows)

    const categories = await cateDatabase.listAll()
    let cateRows = mergeCate(siteRows, categories)
    // Filter
    cateRows = cateRows
        .filter(({ cateKey }) => !cateIds?.length || cateIds.includes(cateKey))
        .filter(({ cateName }) => !query || cateName?.includes(query))
    // Merge cates by date again
    if (needMergeDate) cateRows = mergeDate(cateRows)

    // Sort
    if (sortKey) {
        cateRows.sort((a, b) => compareSortVal(a[sortKey] ?? 0, b[sortKey] ?? 0, sortDirection))
    }
    return cateRows
}

export async function selectCatePage(query?: tt4b.stat.CatePageQuery): Promise<tt4b.common.PageResult<tt4b.stat.CateRow>> {
    const rows = await selectCate(query)
    return slicePageResult(rows, query)
}

async function fillSite(rows: tt4b.stat.SiteRow[]): Promise<true> {
    let keys: tt4b.site.SiteKey[] = []
    extractAllSiteKeys(rows, keys)
    keys = distinctSites(keys)

    const sites = await siteDatabase.getBatch(keys)
    const siteMap = SiteMap.identify(sites)

    rows.forEach(item => fillRowWithSiteInfo(item, siteMap))
    return true
}

export async function selectGroup(param?: tt4b.stat.GroupQuery): Promise<tt4b.stat.GroupRow[]> {
    const {
        date, query, mergeDate: needMergeDate,
        focusRange, timeRange,
        sortKey, sortDirection,
    } = param ?? {}
    const list = await statDatabase.selectGroup({ date, focusRange, timeRange })
    const groups = await listAllGroups()
    const groupMap = toMap(groups, g => g.id)
    let rows: tt4b.stat.GroupRow[] = list.map(({ date, time, focus, run, host }) => {
        const groupKey = parseInt(host)
        const { title, color } = groupMap[groupKey] ?? {}
        return ({ date, groupKey, title, color, run, focus, time })
    })
    rows = rows.filter(({ title }) => !query || title?.includes(query))
    needMergeDate && (rows = mergeDate(rows))
    if (sortKey) {
        rows.sort((a, b) => compareSortVal(a[sortKey] ?? 0, b[sortKey] ?? 0, sortDirection))
    }
    return rows
}

export async function selectGroupPage(param?: tt4b.stat.GroupPageQuery) {
    const rows = await selectGroup(param)
    return slicePageResult(rows, param)
}

export async function countGroup(param?: tt4b.stat.GroupQuery): Promise<number> {
    const { groupIds, date } = param ?? {}
    const keys = groupIds?.map(gid => `${gid}`)
    const rows = await statDatabase.selectGroup({ keys, date })
    return rows.length
}

export async function batchDelete(targets: tt4b.stat.StatKey[]) {
    if (!targets?.length) return
    const siteKeys: tt4b.core.RowKey[] = []
    const groupKeys: [groupId: number, date: string][] = []
    targets.forEach(row => {
        const { date } = row
        if (!date) return
        isSite(row) && siteKeys.push({ host: row.siteKey.host, date })
        isGroup(row) && groupKeys.push([row.groupKey, date])
    })
    await statDatabase.delete(...siteKeys)
    await statDatabase.deleteGroup(...groupKeys)
}