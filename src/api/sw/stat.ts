/**
 * Stat domain: request to sw (service worker). Variable requestStat for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"
import type { SiteQuery, CateQuery, GroupQuery } from "@/background/service/stat-service"

const requestStat = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`stat.${code}` as timer.mq.ReqCode, data)

export function selectSite(param?: SiteQuery) {
    return requestStat<SiteQuery | undefined, timer.stat.SiteRow[]>('selectSite', param)
}

export function selectSitePage(param?: SiteQuery, page?: timer.common.PageQuery) {
    return requestStat<{ param?: SiteQuery; page?: timer.common.PageQuery }, timer.common.PageResult<timer.stat.SiteRow>>('selectSitePage', { param, page })
}

export function selectCate(param?: CateQuery) {
    return requestStat<CateQuery | undefined, timer.stat.CateRow[]>('selectCate', param)
}

export function selectCatePage(query?: CateQuery, page?: timer.common.PageQuery) {
    return requestStat('selectCatePage', { query, page })
}

export function selectGroup(param?: GroupQuery) {
    return requestStat<GroupQuery | undefined, timer.stat.GroupRow[]>('selectGroup', param)
}

export function selectGroupPage(param?: GroupQuery, page?: timer.common.PageQuery) {
    return requestStat('selectGroupPage', { param, page })
}

export function listHosts(fuzzyQuery?: string) {
    return requestStat<string | undefined, Record<timer.site.Type, string[]>>('listHosts', fuzzyQuery)
}

export function mergeDate(rows: timer.stat.SiteRow[]) {
    return requestStat<timer.stat.SiteRow[], timer.stat.SiteRow[]>('mergeDate', rows)
}

export function batchDelete(targets: timer.stat.Row[]) {
    return requestStat<timer.stat.Row[], void>('batchDelete', targets)
}

export function countGroupByIds(groupIds: number[], dateRange: Date | [Date?, Date?]) {
    return requestStat('countGroupByIds', { groupIds, dateRange })
}

export function countSiteByHosts(hosts: string[], dateRange: Date | [Date?, Date?]) {
    return requestStat('countSiteByHosts', { hosts, dateRange })
}

export function canReadRemote() {
    return requestStat<void, boolean>('canReadRemote')
}

export function recommendRate() {
    return requestStat<void, boolean>('recommendRate')
}
