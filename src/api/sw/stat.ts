import { sendMsg2Runtime } from "./common"

export function selectSite(param?: timer.stat.SiteQuery) {
    return sendMsg2Runtime('stat.sites', param)
}

export function selectSitePage(param?: timer.stat.SitePageQuery) {
    return sendMsg2Runtime('stat.sitePage', param)
}

export function deleteSiteByHost(host: string, date?: [string?, string?] | string) {
    return sendMsg2Runtime('stat.deleteSite', { host, date })
}

export function deleteSiteByGroup(groupId: number, date?: [string?, string?] | string) {
    return sendMsg2Runtime('stat.deleteSite', { groupId, date })
}

export function selectCate(param?: timer.stat.CateQuery) {
    return sendMsg2Runtime('stat.cates', param)
}

export function selectCatePage(param?: timer.stat.CatePageQuery) {
    return sendMsg2Runtime('stat.catePage', param)
}

export function selectGroup(param?: timer.stat.GroupQuery) {
    return sendMsg2Runtime('stat.groups', param)
}

export function selectGroupPage(param?: timer.stat.GroupPageQuery) {
    return sendMsg2Runtime('stat.groupPage', param)
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
