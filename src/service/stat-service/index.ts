/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listAllGroups } from "@api/chrome/tabGroups"
import mergeRuleDatabase from "@db/merge-rule-database"
import cateDatabase from "@db/site-cate-database"
import siteDatabase from "@db/site-database"
import statDatabase, { type StatCondition } from "@db/stat-database"
import { toMap } from "@util/array"
import { judgeVirtualFast } from "@util/pattern"
import { CATE_NOT_SET_ID, distinctSites, SiteMap } from "@util/site"
import { isGroup, isNormalSite, isSite } from "@util/stat"
import { log } from "../../common/logger"
import CustomizedHostMergeRuler from "../components/host-merge-ruler"
import { slicePageResult } from "../components/page-info"
import { cvt2SiteRow } from "./common"
import { mergeCate } from "./merge/cate"
import { mergeDate } from "./merge/date"
import { mergeHost } from "./merge/host"
import { processRemote } from "./remote"

function extractAllSiteKeys(rows: timer.stat.SiteRow[], container: timer.site.SiteKey[]) {
    rows.forEach(row => {
        const { mergedRows } = row
        container.push(row.siteKey)
        mergedRows?.length && extractAllSiteKeys(mergedRows, container)
    })
}

function fillRowWithSiteInfo(row: timer.stat.SiteRow, siteMap: SiteMap<timer.site.SiteInfo>): void {
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

function compareSortVal(a: string | number, b: string | number, direction?: timer.common.SortDirection): number {
    if (a === b) return 0
    const val = a > b ? 1 : -1
    return direction === 'DESC' ? -val : val
}

export type SiteQuery = Pick<StatCondition, 'date' | 'focusRange' | 'timeRange' | 'virtual'>
    & timer.common.SortBy<'date' | 'host' | timer.core.Dimension>
    & {
        query?: string
        host?: string
        mergeDate?: boolean
        mergeHost?: boolean
        /**
         * Inclusive remote data
         *
         * If true the date range MUST NOT be unlimited
         *
         * @since 1.2.0
         */
        inclusiveRemote?: boolean
        /**
         * Categories
         *
         * @since 3.0.0
         */
        cateIds?: number[]
        ignoreSite?: boolean
    }

export type CateQuery = Pick<StatCondition, 'date'>
    & timer.common.SortBy<'date' | 'focus' | 'time'>
    & {
        query?: string
        mergeDate?: boolean
        inclusiveRemote?: boolean
        cateIds?: number[]
    }

export type GroupQuery = Pick<StatCondition, 'date'>
    & timer.common.SortBy<'date' | 'title' | 'focus' | 'time'>
    & {
        query?: string
        mergeDate?: boolean
    }

export type CountQuery = Pick<StatCondition, 'date'> & {
    keys: timer.stat.TargetKey
}

function filterByCateId(itemCateId: number | undefined, cateIds: number[] | undefined): boolean {
    if (!cateIds?.length) return true
    return cateIds.includes(itemCateId ?? CATE_NOT_SET_ID)
}

/**
 * Query hosts
 *
 * @param fuzzyQuery the part of host
 * @since 0.0.8
 */
export async function listHosts(fuzzyQuery?: string): Promise<Record<timer.site.Type, string[]>> {
    const rows = await statDatabase.select()
    const allHosts: Set<string> = new Set(rows.map(row => row.host).filter(h => !!h))
    // Generate ruler
    const mergeRuleItems: timer.merge.Rule[] = await mergeRuleDatabase.selectAll()
    const mergeRuler = new CustomizedHostMergeRuler(mergeRuleItems)

    const normalSet: Set<string> = new Set()
    const mergedSet: Set<string> = new Set()
    const virtualSet: Set<string> = new Set()

    const allHostArr = Array.from(allHosts)

    allHostArr.forEach(host => {
        if (judgeVirtualFast(host)) {
            virtualSet.add(host)
            return
        }
        normalSet.add(host)
        const mergedHost = mergeRuler.merge(host)
        mergedSet.add(mergedHost)
    })

    let normal = Array.from(normalSet)
    let merged = Array.from(mergedSet)
    let virtual = Array.from(virtualSet)
    if (fuzzyQuery) {
        normal = normal.filter(host => host?.includes(fuzzyQuery))
        merged = merged.filter(host => host?.includes(fuzzyQuery))
        virtual = virtual.filter(host => host?.includes(fuzzyQuery))
    }

    return { normal, merged, virtual }
}

export async function countSiteByHosts(hosts: string[], dateRange: StatCondition['date']): Promise<number> {
    log("service: countSiteByHosts: {hosts}, {dateRange}", hosts, dateRange)
    const rows = await statDatabase.select({ keys: hosts, date: dateRange })
    const result = rows.length
    log("service: countSiteByHosts: {result}", result)
    return result
}

export async function selectSite(param?: SiteQuery): Promise<timer.stat.SiteRow[]> {
    log("service: select:{param}", param)
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
        const sortVal = (a: timer.stat.SiteRow) => sortKey === 'host' ? a.siteKey.host : a[sortKey] ?? 0
        siteRows.sort((a, b) => compareSortVal(sortVal(a), sortVal(b), sortDirection))
    }
    return siteRows
}

export async function selectSitePage(
    param?: SiteQuery,
    page?: timer.common.PageQuery,
): Promise<timer.common.PageResult<timer.stat.SiteRow>> {
    log("selectByPage:{param},{page}", param, page)
    const rows = await selectSite(param)
    let result = slicePageResult(rows, page)
    log("result of selectByPage:{param}, {page}, {result}", param, page, result)
    return result
}

export async function selectCate(param?: CateQuery): Promise<timer.stat.CateRow[]> {
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
    const categories = await cateDatabase.listAll()
    let cateRows = mergeCate(siteRows, categories)
    // Filter
    cateRows = cateRows
        .filter(({ cateKey }) => !cateIds?.length || cateIds.includes(cateKey))
        .filter(({ cateName }) => !query || cateName?.includes(query))
    // Merge by date
    needMergeDate && (cateRows = mergeDate(cateRows))
    // Sort
    if (sortKey) {
        cateRows.sort((a, b) => compareSortVal(a[sortKey] ?? 0, b[sortKey] ?? 0, sortDirection))
    }
    return cateRows
}

export async function selectCatePage(query?: CateQuery, page?: timer.common.PageQuery): Promise<timer.common.PageResult<timer.stat.CateRow>> {
    const rows = await selectCate(query)
    return slicePageResult(rows, page)
}

async function fillSite(rows: timer.stat.SiteRow[]): Promise<true> {
    let keys: timer.site.SiteKey[] = []
    extractAllSiteKeys(rows, keys)
    keys = distinctSites(keys)

    const siteInfos = await siteDatabase.getBatch(keys)
    const siteInfoMap = new SiteMap<timer.site.SiteInfo>()
    siteInfos.forEach(siteInfo => siteInfoMap.put(siteInfo, siteInfo))

    rows.forEach(item => fillRowWithSiteInfo(item, siteInfoMap))
    return true
}

export async function selectGroup(param?: GroupQuery): Promise<timer.stat.GroupRow[]> {
    const {
        date, query, mergeDate: needMergeDate,
        sortKey, sortDirection,
    } = param ?? {}
    const list = await statDatabase.selectGroup({ date })
    const groups = await listAllGroups()
    const groupMap = toMap(groups, g => g.id)
    let rows: timer.stat.GroupRow[] = list.map(({ date, time, focus, run, host }) => {
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

export async function selectGroupPage(
    param?: GroupQuery,
    page?: timer.common.PageQuery,
) {
    const rows = await selectGroup(param)
    return slicePageResult(rows, page)
}

export async function countGroupByIds(groupIds: number[], dateRange: StatCondition["date"]): Promise<number> {
    log("service: countGroupByIds: {groupIds}, {dateRange}", groupIds, dateRange)
    const keys = groupIds.map(gid => `${gid}`)
    const rows = await statDatabase.selectGroup({ keys, date: dateRange })
    const result = rows.length
    log("service: countGroupByIds: {result}", result)
    return result
}

export async function batchDelete(targets: timer.stat.Row[]) {
    if (!targets?.length) return
    const siteKeys: timer.core.RowKey[] = []
    const groupKeys: [groupId: number, date: string][] = []
    targets.forEach(row => {
        const { date } = row
        if (!date) return
        isNormalSite(row) && siteKeys.push({ host: row.siteKey.host, date })
        isGroup(row) && groupKeys.push([row.groupKey, date])
    })
    await statDatabase.delete(siteKeys)
    await statDatabase.deleteGroup(groupKeys)
}

export async function selectGroupByPage(param?: GroupQuery, page?: timer.common.PageQuery): Promise<timer.common.PageResult<timer.stat.Row>> {
    const rows = await selectGroup(param)
    return slicePageResult(rows, page)
}