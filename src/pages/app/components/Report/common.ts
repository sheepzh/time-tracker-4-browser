import { t } from "@app/locale"
import statDatabase from "@db/stat-database"
import {
    selectCate, selectCatePage, selectGroup, selectGroupPage, selectSite, selectSitePage,
    type CateQuery, type GroupQuery, type SiteQuery,
} from "@service/stat-service"
import { getGroupName, isGroup, isSite } from "@util/stat"
import { formatTime, getBirthday } from "@util/time"
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

function computeRangeConfirmText(url: string, dateRange: [Date?, Date?]): string {
    let [startDate, endDate] = dateRange
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
        isSite(row) && date && await statDatabase.delete({ host: row.siteKey.host, date })
        isGroup(row) && date && await statDatabase.deleteGroup([row.groupKey, date])
        return
    }
    const start = dateRange?.[0]
    const end = dateRange?.[1]
    if (!start && !end) {
        // Delete all
        isSite(row) && await statDatabase.deleteByHost(row.siteKey.host)
        isGroup(row) && await statDatabase.deleteByGroup(row.groupKey)
        return
    }

    // Delete by range
    isSite(row) && await statDatabase.deleteByHost(row.siteKey.host, [start, end])
    isGroup(row) && await statDatabase.deleteByGroup(row.groupKey, [start, end])
}

const cvtOrderDir = (order: ReportSort['order']): timer.common.SortDirection | undefined => {
    if (order === 'ascending') return 'ASC'
    else if (order === 'descending') return 'DESC'
    else return undefined
}

const cvt2GroupQuery = (
    { query, mergeDate, dateRange: date }: ReportFilterOption,
    { prop, order }: ReportSort,
): GroupQuery => ({
    date, mergeDate, query,
    sortKey: prop !== 'host' && prop !== 'run' ? prop : undefined,
    sortDirection: cvtOrderDir(order),
})

const cvt2SiteQuery = (
    { dateRange: date, mergeDate, siteMerge, query, cateIds, readRemote: inclusiveRemote }: ReportFilterOption,
    { prop, order }: ReportSort,
): SiteQuery => ({
    date, mergeDate,
    mergeHost: siteMerge === 'domain',
    query, cateIds, inclusiveRemote,
    virtual: true,
    sortKey: prop,
    sortDirection: cvtOrderDir(order),
})

const cvt2CateQuery = (
    { dateRange: date, mergeDate, query, cateIds, readRemote: inclusiveRemote }: ReportFilterOption,
    { prop, order }: ReportSort,
): CateQuery => ({
    date, mergeDate, query, cateIds, inclusiveRemote,
    sortKey: prop !== 'host' && prop !== 'run' ? prop : undefined,
    sortDirection: cvtOrderDir(order),
})

export const queryPage = (filter: ReportFilterOption, sort: ReportSort, page: timer.common.PageQuery): Promise<timer.common.PageResult<timer.stat.Row>> => {
    const { siteMerge } = filter
    if (siteMerge === 'group') {
        return selectGroupPage(cvt2GroupQuery(filter, sort), page)
    } else if (siteMerge === 'cate') {
        return selectCatePage(cvt2CateQuery(filter, sort), page)
    } else {
        return selectSitePage(cvt2SiteQuery(filter, sort), page)
    }
}

export const queryAll = (filter: ReportFilterOption, sort: ReportSort): Promise<timer.stat.Row[]> => {
    const { siteMerge } = filter
    if (siteMerge === 'group') {
        return selectGroup(cvt2GroupQuery(filter, sort))
    } else if (siteMerge === 'cate') {
        return selectCate(cvt2CateQuery(filter, sort))
    } else {
        return selectSite(cvt2SiteQuery(filter, sort))
    }
}