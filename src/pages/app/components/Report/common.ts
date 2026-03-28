import { t } from '@app/locale'
import {
    deleteSiteByGroup,
    deleteSiteByHost,
    selectCate, selectCatePage, selectGroup, selectGroupPage, selectSite, selectSitePage,
} from "@api/sw/stat"
import { getGroupName, isGroup, isSite } from "@util/stat"
import { cvtDateRange2Str, type DateRange, formatTime, getBirthday } from "@util/time"
import type { ReportFilterOption, ReportSort } from "./types"

/**
 * Compute the confirm text for one item to delete
 *
 * @param url  item url
 * @param date item date
 */
function computeSingleConfirmText(url: string, date: string): string {
    return t(msg => msg.item.operation.deleteConfirmMsg, { url, date })
}

function computeRangeConfirmText(url: string, dateRange: DateRange): string {
    let [startDate, endDate] = dateRange instanceof Date ? [dateRange,] : dateRange ?? []
    if (!startDate && !endDate) {
        // Delete all
        return t(msg => msg.item.operation.deleteConfirmMsgAll, { url })
    }
    const dateFormat = t(msg => msg.calendar.dateFormat)
    startDate = startDate ?? getBirthday()
    endDate = endDate ?? new Date()
    const start = formatTime(startDate, dateFormat)
    const end = formatTime(endDate, dateFormat)
    return start === end
        // Only one day
        ? computeSingleConfirmText(url, start)
        : t(msg => msg.item.operation.deleteConfirmMsgRange, { url, start, end })
}

export function computeDeleteConfirmMsg(row: timer.stat.Row, filterOption: ReportFilterOption, groupMap: Record<number, chrome.tabGroups.TabGroup>): string {
    let name: string | undefined
    if (isGroup(row)) {
        name = getGroupName(groupMap, row)
    } else if (isSite(row)) {
        name = row.siteKey.host
    }
    const { date } = row
    const { mergeDate, dateRange } = filterOption || {}
    name = name ?? 'NaN'
    return mergeDate
        ? computeRangeConfirmText(name, dateRange)
        : computeSingleConfirmText(name, date ?? '')
}

export async function handleDelete(row: timer.stat.Row, filterOption: ReportFilterOption) {
    const { date } = row
    const { mergeDate, dateRange } = filterOption
    if (!mergeDate) {
        // Delete one day
        isSite(row) && date && await deleteSiteByHost(row.siteKey.host, date)
        isGroup(row) && date && await deleteSiteByGroup(row.groupKey, date)
        return
    }
    const strRange = cvtDateRange2Str(dateRange)
    const [start, end] = strRange ?? []
    if (!start && !end) {
        // Delete all
        isSite(row) && await deleteSiteByHost(row.siteKey.host)
        isGroup(row) && await deleteSiteByGroup(row.groupKey)
        return
    }

    // Delete by range
    isSite(row) && await deleteSiteByHost(row.siteKey.host, strRange)
    isGroup(row) && await deleteSiteByGroup(row.groupKey, strRange)
}

const cvtOrderDir = (order: ReportSort['order']): timer.common.SortDirection | undefined => {
    if (order === 'ascending') return 'ASC'
    else if (order === 'descending') return 'DESC'
    else return undefined
}

const cvt2GroupQuery = (
    { query, mergeDate, dateRange: date }: ReportFilterOption,
    { prop, order }: ReportSort,
): timer.stat.GroupQuery => ({
    date: cvtDateRange2Str(date), mergeDate, query,
    sortKey: prop !== 'host' && prop !== 'run' ? prop : undefined,
    sortDirection: cvtOrderDir(order),
})

const cvt2SiteQuery = (
    { dateRange: date, mergeDate, siteMerge, query, cateIds, readRemote: inclusiveRemote }: ReportFilterOption,
    { prop, order }: ReportSort,
): timer.stat.SiteQuery => ({
    date: cvtDateRange2Str(date), mergeDate,
    mergeHost: siteMerge === 'domain',
    query, cateIds, inclusiveRemote,
    virtual: true,
    sortKey: prop,
    sortDirection: cvtOrderDir(order),
})

const cvt2CateQuery = (
    { dateRange: date, mergeDate, query, cateIds, readRemote: inclusiveRemote }: ReportFilterOption,
    { prop, order }: ReportSort,
): timer.stat.CateQuery => ({
    date: cvtDateRange2Str(date), mergeDate, query, cateIds, inclusiveRemote,
    sortKey: prop !== 'host' && prop !== 'run' ? prop : undefined,
    sortDirection: cvtOrderDir(order),
})

export const queryPage = async (filter: ReportFilterOption, sort: ReportSort, page: timer.common.PageQuery): Promise<timer.common.PageResult<timer.stat.Row>> => {
    const { siteMerge } = filter
    if (siteMerge === 'group') {
        return await selectGroupPage({ ...cvt2GroupQuery(filter, sort), ...page })
    } else if (siteMerge === 'cate') {
        return await selectCatePage({ ...cvt2CateQuery(filter, sort), ...page })
    } else {
        return await selectSitePage({ ...cvt2SiteQuery(filter, sort), ...page })
    }
}

export const queryAll = async (filter: ReportFilterOption, sort: ReportSort): Promise<timer.stat.Row[]> => {
    const { siteMerge } = filter
    if (siteMerge === 'group') {
        return await selectGroup(cvt2GroupQuery(filter, sort))
    } else if (siteMerge === 'cate') {
        return await selectCate(cvt2CateQuery(filter, sort))
    } else {
        return await selectSite(cvt2SiteQuery(filter, sort))
    }
}