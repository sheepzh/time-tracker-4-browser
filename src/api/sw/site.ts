/**
 * Site domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime-sender"

export type SiteQueryParam = {
    fuzzyQuery?: string
    cateIds?: number | number[]
    types?: timer.site.Type | timer.site.Type[]
}

export function getSitePslSuffix(host: string) {
    return sendMsg2Runtime('site.getPslSuffix', host)
}

export function getSite(key: timer.site.SiteKey) {
    return sendMsg2Runtime('site.getSite', key)
}

export function selectAllSites(param?: SiteQueryParam) {
    return sendMsg2Runtime('site.selectAllSites', param)
}

export function selectSitePage(param?: SiteQueryParam, page?: timer.common.PageQuery) {
    return sendMsg2Runtime('site.selectSitePage', { param, page })
}

export function addSite(info: timer.site.SiteInfo) {
    return sendMsg2Runtime('site.addSite', info)
}

export function removeSites(...keys: timer.site.SiteKey[]) {
    return sendMsg2Runtime('site.removeSites', keys)
}

export function saveSiteCate(key: timer.site.SiteKey, cateId: number | undefined) {
    return sendMsg2Runtime('site.saveSiteCate', { key, cateId })
}

export function batchSaveSiteCate(cateId: number | undefined, keys: timer.site.SiteKey[]) {
    return sendMsg2Runtime('site.batchSaveSiteCate', { cateId, keys })
}

export function removeIconUrl(key: timer.site.SiteKey) {
    return sendMsg2Runtime('site.removeIconUrl', key)
}

export function saveSiteRunState(key: timer.site.SiteKey, run: boolean) {
    return sendMsg2Runtime('site.saveSiteRunState', { key, run })
}

export function batchGetSites(keys: timer.site.SiteKey[]) {
    return sendMsg2Runtime('site.batchGetSites', keys)
}

export function batchSaveAliasNoRewrite(items: Array<{ key: timer.site.SiteKey; alias: string }>) {
    return sendMsg2Runtime('site.batchSaveAliasNoRewrite', items)
}

export function removeAlias(key: timer.site.SiteKey) {
    return sendMsg2Runtime('site.removeAlias', key)
}

export function saveAlias(key: timer.site.SiteKey, alias: string, noRewrite?: boolean) {
    return sendMsg2Runtime('site.saveAlias', { key, alias, noRewrite })
}
