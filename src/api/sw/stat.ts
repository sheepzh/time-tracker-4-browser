/**
 * Stat domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime-sender"

export function selectSite(param?: timer.stat.SiteQuery) {
    return sendMsg2Runtime('stat.selectSite', param)
}

export function selectSitePage(param?: timer.stat.SitePageQuery) {
    return sendMsg2Runtime('stat.selectSitePage', param)
}

export function selectCate(param?: timer.stat.CateQuery) {
    return sendMsg2Runtime('stat.selectCate', param)
}

export function selectCatePage(param?: timer.stat.CatePageQuery) {
    return sendMsg2Runtime('stat.selectCatePage', param)
}

export function selectGroup(param?: timer.stat.GroupQuery) {
    return sendMsg2Runtime('stat.selectGroup', param)
}

export function selectGroupPage(param?: timer.stat.GroupPageQuery) {
    return sendMsg2Runtime('stat.selectGroupPage', param)
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

export function countGroupByIds(groupIds: number[], date: string | [string?, string?]) {
    return sendMsg2Runtime('stat.countGroup', { groupIds, date })
}

export function countSiteByHosts(hosts: string[], date: string | [string?, string?]) {
    return sendMsg2Runtime('stat.countSite', { host: hosts, date })
}

export function canReadRemote() {
    return sendMsg2Runtime('stat.canReadRemote')
}

export function recommendRate() {
    return sendMsg2Runtime('stat.recommendRate')
}
