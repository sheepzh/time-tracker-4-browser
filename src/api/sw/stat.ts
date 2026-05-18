import { sendMsg2Runtime } from "./common"

export const listSiteStats = (param?: tt4b.stat.SiteQuery) => sendMsg2Runtime('stat.sites', param)

export const getSiteStatPage = (param?: tt4b.stat.SitePageQuery) => sendMsg2Runtime('stat.sitePage', param)

export function deleteSiteStatByHost(host: string, date?: [string?, string?] | string) {
    return sendMsg2Runtime('stat.deleteSite', { host, date })
}

export function deleteSiteStatByGroup(groupId: number, date?: [string?, string?] | string) {
    return sendMsg2Runtime('stat.deleteSite', { groupId, date })
}

export const listCateStats = (param?: tt4b.stat.CateQuery) => sendMsg2Runtime('stat.cates', param)

export const getCateStatPage = (param?: tt4b.stat.CatePageQuery) => sendMsg2Runtime('stat.catePage', param)

export const listGroupStats = (param?: tt4b.stat.GroupQuery) => sendMsg2Runtime('stat.groups', param)

export const getGroupStatPage = (param?: tt4b.stat.GroupPageQuery) => sendMsg2Runtime('stat.groupPage', param)

export const batchDeleteStats = (targets: tt4b.stat.Row[]) => sendMsg2Runtime('stat.batchDelete', targets)

export function countGroupStatsByIds(groupIds: number[], date: string | [string?, string?]) {
    return sendMsg2Runtime('stat.countGroup', { groupIds, date })
}

export function countSiteStatsByHosts(hosts: string[], date: string | [string?, string?]) {
    return sendMsg2Runtime('stat.countSite', { host: hosts, date })
}
