import { sendMsg2Runtime } from "./common"

export const listSites = (param?: timer.site.Query) => sendMsg2Runtime('site.list', param)

export function getSitePage(param?: timer.site.Query, page?: timer.common.PageQuery) {
    return sendMsg2Runtime('site.page', { ...param, ...page })
}

export const deleteSites = (...keys: timer.site.SiteKey[]) => sendMsg2Runtime('site.delete', keys)

export function changeSitesCate(cateId: number | undefined, ...keys: timer.site.SiteKey[]) {
    return sendMsg2Runtime('site.changeCate', { keys, cateId })
}

export const deleteSiteIcon = (key: timer.site.SiteKey) => sendMsg2Runtime('site.deleteIcon', key)

export async function changeSiteAlias(key: timer.site.SiteKey, alias: string | undefined): Promise<string | undefined> {
    const trimmed = alias?.trim() || undefined
    await sendMsg2Runtime('site.changeAlias', { key, alias: trimmed })
    return trimmed
}

export const fillInitialAlias = (keys: timer.site.SiteKey[]) => sendMsg2Runtime('site.fillAlias', keys)

export const getInitialAlias = (host: string) => sendMsg2Runtime('site.initialAlias', host)

export function changeSiteRun(key: timer.site.SiteKey, enabled: boolean) {
    return sendMsg2Runtime('site.changeRun', { key, enabled })
}

export const searchSite = (query?: string) => sendMsg2Runtime('site.search', query)
