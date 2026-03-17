/**
 * Site domain: request to sw. Variable requestSite for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

export type SiteQueryParam = {
    fuzzyQuery?: string
    cateIds?: number | number[]
    types?: timer.site.Type | timer.site.Type[]
}

const requestSite = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`site.${code}` as timer.mq.ReqCode, data)

export function getSite(key: timer.site.SiteKey) {
    return requestSite<timer.site.SiteKey, timer.site.SiteInfo>('getSite', key)
}

export function selectAllSites(param?: SiteQueryParam) {
    return requestSite<SiteQueryParam | undefined, timer.site.SiteInfo[]>('selectAllSites', param)
}

export function selectSitePage(param?: SiteQueryParam, page?: timer.common.PageQuery) {
    return requestSite('selectSitePage', { param, page })
}

export function addSite(info: timer.site.SiteInfo) {
    return requestSite<timer.site.SiteInfo, void>('addSite', info)
}

export function removeSites(...keys: timer.site.SiteKey[]) {
    return requestSite<timer.site.SiteKey[], void>('removeSites', keys)
}

export function saveSiteCate(key: timer.site.SiteKey, cateId: number | undefined) {
    return requestSite<{ key: timer.site.SiteKey; cateId: number | undefined }, void>('saveSiteCate', { key, cateId })
}

export function batchSaveSiteCate(cateId: number | undefined, keys: timer.site.SiteKey[]) {
    return requestSite<{ cateId: number | undefined; keys: timer.site.SiteKey[] }, void>('batchSaveSiteCate', { cateId, keys })
}

export function removeIconUrl(key: timer.site.SiteKey) {
    return requestSite<timer.site.SiteKey, void>('removeIconUrl', key)
}

export function saveSiteRunState(key: timer.site.SiteKey, run: boolean) {
    return requestSite<{ key: timer.site.SiteKey; run: boolean }, void>('saveSiteRunState', { key, run })
}

export function batchGetSites(keys: timer.site.SiteKey[]) {
    return requestSite<timer.site.SiteKey[], timer.site.SiteInfo[]>('batchGetSites', keys)
}

export function batchSaveAliasNoRewrite(items: Array<{ key: timer.site.SiteKey; alias: string }>) {
    return requestSite<Array<{ key: timer.site.SiteKey; alias: string }>, void>('batchSaveAliasNoRewrite', items)
}

export function removeAlias(key: timer.site.SiteKey) {
    return requestSite<timer.site.SiteKey, void>('removeAlias', key)
}

export function saveAlias(key: timer.site.SiteKey, alias: string, noRewrite?: boolean) {
    return requestSite<{ key: timer.site.SiteKey; alias: string; noRewrite?: boolean }, void>('saveAlias', { key, alias, noRewrite })
}
