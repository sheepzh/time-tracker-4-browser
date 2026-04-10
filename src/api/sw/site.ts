import { sendMsg2Runtime } from "./common"

export function selectAllSites(param?: timer.site.Query) {
    return sendMsg2Runtime('site.all', param)
}

export function selectSitePage(param?: timer.site.Query, page?: timer.common.PageQuery) {
    return sendMsg2Runtime('site.page', { ...param, ...page })
}

export function deleteSites(...keys: timer.site.SiteKey[]) {
    return sendMsg2Runtime('site.delete', keys)
}

export function changeCateOfSites(cateId: number | undefined, ...keys: timer.site.SiteKey[]) {
    return sendMsg2Runtime('site.changeCate', { keys, cateId })
}

export function removeIconUrl(key: timer.site.SiteKey) {
    return sendMsg2Runtime('site.deleteIcon', key)
}

export async function saveAlias(key: timer.site.SiteKey, alias: string | undefined): Promise<string | undefined> {
    const trimmed = alias?.trim() || undefined
    await sendMsg2Runtime('site.changeAlias', { key, alias: trimmed })
    return trimmed
}

export async function fillInitialAlias(keys: timer.site.SiteKey[]) {
    return sendMsg2Runtime('site.fillAlias', keys)
}

export async function getInitialAlias(host: string) {
    return sendMsg2Runtime('site.initialAlias', host)
}

export function changeSiteRun(key: timer.site.SiteKey, enabled: boolean) {
    return sendMsg2Runtime('site.changeRun', { key, enabled })
}

export function searchSite(query?: string) {
    return sendMsg2Runtime('site.search', query)
}
