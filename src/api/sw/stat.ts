/**
 * Stat domain: request to sw.
 */
import type { CateQuery, GroupQuery, SiteQuery } from "@/background/service/stat-service"
import { sendMsg2Runtime } from "@api/chrome/runtime"

export function selectSite(param?: SiteQuery) {
    return sendMsg2Runtime('stat.selectSite', param)
}

export function selectSitePage(param?: SiteQuery, page?: timer.common.PageQuery) {
    return sendMsg2Runtime('stat.selectSitePage', { param, page })
}

export function selectCate(param?: CateQuery) {
    return sendMsg2Runtime('stat.selectCate', param)
}

export function selectCatePage(query?: CateQuery, page?: timer.common.PageQuery) {
    return sendMsg2Runtime('stat.selectCatePage', { query, page })
}

export function selectGroup(param?: GroupQuery) {
    return sendMsg2Runtime('stat.selectGroup', param)
}

export function selectGroupPage(param?: GroupQuery, page?: timer.common.PageQuery) {
    return sendMsg2Runtime('stat.selectGroupPage', { param, page })
}

export function listHosts(fuzzyQuery?: string) {
    return sendMsg2Runtime('stat.listHosts', fuzzyQuery)
}

export function mergeDate(rows: timer.stat.SiteRow[]) {
    return sendMsg2Runtime('stat.mergeDate', rows)
}

export function batchDelete(targets: timer.stat.Row[]) {
    return sendMsg2Runtime('stat.batchDelete', targets)
}

export function countGroupByIds(groupIds: number[], dateRange: Date | [Date?, Date?]) {
    return sendMsg2Runtime('stat.countGroupByIds', { groupIds, dateRange })
}

export function countSiteByHosts(hosts: string[], dateRange: Date | [Date?, Date?]) {
    return sendMsg2Runtime('stat.countSiteByHosts', { hosts, dateRange })
}

export function canReadRemote() {
    return sendMsg2Runtime('stat.canReadRemote')
}

export function recommendRate() {
    return sendMsg2Runtime('stat.recommendRate')
}
