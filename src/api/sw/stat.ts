import { sendMsg2Runtime } from "./common"

export const listSiteStats = (param?: timer.stat.SiteQuery) => sendMsg2Runtime('stat.sites', param)

export const getSiteStatPage = (param?: timer.stat.SitePageQuery) => sendMsg2Runtime('stat.sitePage', param)

export function deleteSiteStatByHost(host: string, date?: [string?, string?] | string) {
    return sendMsg2Runtime('stat.deleteSite', { host, date })
}

export function deleteSiteStatByGroup(groupId: number, date?: [string?, string?] | string) {
    return sendMsg2Runtime('stat.deleteSite', { groupId, date })
}

export const listCateStats = (param?: timer.stat.CateQuery) => sendMsg2Runtime('stat.cates', param)

export const getCateStatPage = (param?: timer.stat.CatePageQuery) => sendMsg2Runtime('stat.catePage', param)

export const listGroupStats = (param?: timer.stat.GroupQuery) => sendMsg2Runtime('stat.groups', param)

export const getGroupStatPage = (param?: timer.stat.GroupPageQuery) => sendMsg2Runtime('stat.groupPage', param)

export const batchDeleteStats = (targets: timer.stat.Row[]) => sendMsg2Runtime('stat.batchDelete', targets)

export function countGroupStatsByIds(groupIds: number[], date: string | [string?, string?]) {
    return sendMsg2Runtime('stat.countGroup', { groupIds, date })
}

export function countSiteStatsByHosts(hosts: string[], date: string | [string?, string?]) {
    return sendMsg2Runtime('stat.countSite', { host: hosts, date })
}
