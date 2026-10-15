import {
    deleteSiteStatByGroup, deleteSiteStatByHost, getCateStatPage, getGroupStatPage, getSiteStatPage, listCateStats,
    listGroupStats, listSiteStats,
} from "@api/sw/stat"
import { t } from '@app/locale'
import { cvt2LocaleDate } from '@app/util/time'
import { getGroupName, isGroup, isSite } from "@util/stat"
import { cvtDateRange2Str, getBirthday } from "@util/time"
import type { RecordFilterOption, RecordSort } from "./types"

export function computeDeleteConfirmMsg(row: tt4b.stat.Row, filterOption: RecordFilterOption, groupMap: Record<number, chrome.tabGroups.TabGroup>): string {
    let url: string
    if (isGroup(row)) {
        url = getGroupName(groupMap, row)
    } else if (isSite(row)) {
        url = row.siteKey.host
    } else {
        url = 'NaN'
    }
    const { mergeDate, dateRange } = filterOption
    const [start, end] = mergeDate ? dateRange : [row.date]
    if (start === undefined && end === undefined) return t(msg => msg.item.operation.deleteConfirmMsgAll, { url })
    const date = cvt2LocaleDate(start ?? getBirthday(), end ?? new Date())
    return t(msg => msg.item.operation.deleteConfirmMsg, { url, date })
}

export async function handleDelete(row: tt4b.stat.Row, filterOption: RecordFilterOption) {
    const { date } = row
    const { mergeDate, dateRange } = filterOption
    if (!mergeDate) {
        // Delete one day
        isSite(row) && date && await deleteSiteStatByHost(row.siteKey.host, date)
        isGroup(row) && date && await deleteSiteStatByGroup(row.groupKey, date)
        return
    }
    const strRange = cvtDateRange2Str(dateRange)
    const [start, end] = strRange ?? []
    if (!start && !end) {
        // Delete all
        isSite(row) && await deleteSiteStatByHost(row.siteKey.host)
        isGroup(row) && await deleteSiteStatByGroup(row.groupKey)
        return
    }

    // Delete by range
    isSite(row) && await deleteSiteStatByHost(row.siteKey.host, strRange)
    isGroup(row) && await deleteSiteStatByGroup(row.groupKey, strRange)
}

const cvtOrderDir = (order: RecordSort['order']): tt4b.common.SortDirection | undefined => {
    if (order === 'ascending') return 'ASC'
    else if (order === 'descending') return 'DESC'
    else return undefined
}

const cvt2GroupQuery = (
    { query, mergeDate, dateRange: date, focusRange, timeRange }: RecordFilterOption,
    { prop, order }: RecordSort,
): tt4b.stat.GroupQuery => ({
    date: cvtDateRange2Str(date), mergeDate, query,
    sortKey: prop !== 'host' ? prop : undefined,
    sortDirection: cvtOrderDir(order),
    focusRange, timeRange,
})

const cvt2SiteQuery = (
    { dateRange: date, mergeDate, siteMerge, query, cateIds, focusRange, timeRange }: RecordFilterOption,
    { prop, order }: RecordSort,
): Omit<tt4b.stat.SiteQuery, 'remote'> => ({
    date: cvtDateRange2Str(date), mergeDate,
    mergeHost: siteMerge === 'domain',
    query, cateIds,
    virtual: true,
    sortKey: prop,
    sortDirection: cvtOrderDir(order),
    focusRange, timeRange,
})

const cvt2CateQuery = (
    { dateRange: date, mergeDate, query, cateIds, focusRange, timeRange }: RecordFilterOption,
    { prop, order }: RecordSort,
): Omit<tt4b.stat.CateQuery, 'remote'> => ({
    date: cvtDateRange2Str(date), mergeDate, query, cateIds,
    sortKey: prop !== 'host' ? prop : undefined,
    sortDirection: cvtOrderDir(order),
    focusRange, timeRange,
})

export const queryPage = async (
    filter: RecordFilterOption,
    sort: RecordSort,
    page: tt4b.common.PageQuery,
    remote: boolean,
): Promise<tt4b.common.PageResult<tt4b.stat.Row>> => {
    const { siteMerge } = filter
    if (siteMerge === 'group') {
        return await getGroupStatPage({ ...cvt2GroupQuery(filter, sort), ...page })
    } else if (siteMerge === 'cate') {
        return await getCateStatPage({ ...cvt2CateQuery(filter, sort), ...page, remote })
    } else {
        return await getSiteStatPage({ ...cvt2SiteQuery(filter, sort), ...page, remote })
    }
}

export const queryAll = async (
    filter: RecordFilterOption, sort: RecordSort, remote: boolean,
): Promise<tt4b.stat.Row[]> => {
    const { siteMerge } = filter
    if (siteMerge === 'group') {
        return await listGroupStats(cvt2GroupQuery(filter, sort))
    } else if (siteMerge === 'cate') {
        return await listCateStats({ ...cvt2CateQuery(filter, sort), remote })
    } else {
        return await listSiteStats({ ...cvt2SiteQuery(filter, sort), remote })
    }
}