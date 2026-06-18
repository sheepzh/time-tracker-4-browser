import { sendMsg2Runtime } from "./common"

export const listSites = (param?: tt4b.site.Query) => sendMsg2Runtime('site.list', param)

export function getSitePage(param?: tt4b.site.Query, page?: tt4b.common.PageQuery) {
    return sendMsg2Runtime('site.page', { ...param, ...page })
}

export const deleteSites = (...keys: tt4b.site.SiteKey[]) => sendMsg2Runtime('site.delete', keys)

export function changeSitesCate(cateId: number | undefined, ...keys: tt4b.site.SiteKey[]) {
    return sendMsg2Runtime('site.changeCate', { keys, cateId })
}

export const modifySite = (param: tt4b.site.ModifyParam) => sendMsg2Runtime('site.modify', param)

export const fillInitialAlias = (keys: tt4b.site.SiteKey[]) => sendMsg2Runtime('site.fillAlias', keys)

export const getInitialAlias = (host: string) => sendMsg2Runtime('site.initialAlias', host)

export function changeSiteRun(key: tt4b.site.SiteKey, enabled: boolean) {
    return sendMsg2Runtime('site.changeRun', { key, enabled })
}

export const searchSite = (query?: string) => sendMsg2Runtime('site.search', query)
