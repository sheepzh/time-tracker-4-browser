/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getUsedStorage, type MemoryInfo } from "@/background/database/memory-detector"
import type { SiteCondition } from "@/background/database/site-database"
import type { StatCondition } from "@/background/database/stat-database"
import backupProcessor, { type RemoteQueryParam } from "@/background/service/backup/processor"
import cateService from "@/background/service/cate-service"
import immigration from "@/background/service/components/immigration"
import { fillExist, processImportedData } from "@/background/service/components/import-processor"
import optionHolder from "@/background/service/components/option-holder"
import { merge } from "@/background/service/components/period-calculator"
import limitService from "@/background/service/limit-service"
import type { VerificationPair } from "@/background/service/limit-service/verification/common"
import verificationProcessor from "@/background/service/limit-service/verification/processor"
import { getCid, getLastBackUp, increaseApp, increasePopup, recommendRate, saveFlag } from "@/background/service/meta-service"
import optionService from "@/background/service/option-service"
import periodService from "@/background/service/period-service"
import {
    addSite,
    batchGetSites,
    batchSaveAliasNoRewrite,
    batchSaveSiteCate,
    getSite,
    removeAlias,
    removeIconUrl,
    removeSites,
    saveAlias,
    saveSiteCate,
    saveSiteRunState,
    selectAllSites,
    selectSitePage as selectSitePageInSiteService,
} from "@/background/service/site-service"
import {
    batchDelete,
    countGroupByIds,
    countSiteByHosts,
    listHosts,
    selectCate,
    selectCatePage,
    selectGroup,
    selectGroupPage,
    selectSite,
    selectSitePage,
    type CateQuery,
    type GroupQuery,
    type SiteQuery,
} from "@/background/service/stat-service"
import { mergeDate } from "@/background/service/stat-service/merge/date"
import { canReadRemote } from "@/background/service/stat-service/remote"
import whitelistService from "@/background/service/whitelist/service"
import { onRuntimeMessage } from "@api/chrome/runtime"
import { SiteMap } from "@util/site"

class MessageDispatcher {
    private handlers: Partial<{
        [code in timer.mq.ReqCode]: timer.mq.Handler<any, any>
    }> = {}

    constructor() {
        this.initServiceHandlers()
    }

    register<Req = any, Res = any>(code: timer.mq.ReqCode, handler: timer.mq.Handler<Req, Res>): MessageDispatcher {
        if (this.handlers[code]) {
            throw new Error("Duplicate handler")
        }
        this.handlers[code] = handler
        return this
    }

    private initServiceHandlers() {
        this
            .register<SiteQuery | undefined, timer.stat.SiteRow[]>('stat.selectSite', param => selectSite(param))
            .register<{ param?: SiteQuery; page?: timer.common.PageQuery }, timer.common.PageResult<timer.stat.SiteRow>>(
                'stat.selectSitePage',
                ({ param, page }) => selectSitePage(param, page)
            )
            .register<CateQuery | undefined, timer.stat.CateRow[]>('stat.selectCate', param => selectCate(param))
            .register<{ query?: CateQuery; page?: timer.common.PageQuery }, timer.common.PageResult<timer.stat.CateRow>>(
                'stat.selectCatePage',
                ({ query, page }) => selectCatePage(query, page)
            )
            .register<GroupQuery | undefined, timer.stat.GroupRow[]>('stat.selectGroup', param => selectGroup(param))
            .register<{ param?: GroupQuery; page?: timer.common.PageQuery }, timer.common.PageResult<timer.stat.GroupRow>>(
                'stat.selectGroupPage',
                ({ param, page }) => selectGroupPage(param, page)
            )
            .register<string | undefined, Record<timer.site.Type, string[]>>('stat.listHosts', q => listHosts(q))
            .register<timer.stat.SiteRow[], timer.stat.SiteRow[]>('stat.mergeDate', rows => Promise.resolve(mergeDate(rows)))
            .register<timer.stat.Row[], void>('stat.batchDelete', targets => batchDelete(targets))
            .register<{ groupIds: number[]; dateRange: StatCondition['date'] }, number>(
                'stat.countGroupByIds',
                ({ groupIds, dateRange }) => countGroupByIds(groupIds, dateRange)
            )
            .register<{ hosts: string[]; dateRange: StatCondition['date'] }, number>(
                'stat.countSiteByHosts',
                ({ hosts, dateRange }) => countSiteByHosts(hosts, dateRange)
            )
            .register<void, boolean>('stat.canReadRemote', () => canReadRemote())
            .register<void, boolean>('stat.recommendRate', () => recommendRate())
            .register<timer.site.SiteKey, timer.site.SiteInfo>('site.getSite', key => getSite(key))
            .register<SiteCondition | undefined, timer.site.SiteInfo[]>('site.selectAllSites', param => selectAllSites(param))
            .register<{ param?: SiteCondition; page?: timer.common.PageQuery }, timer.common.PageResult<timer.site.SiteInfo>>(
                'site.selectSitePage',
                ({ param, page }) => selectSitePageInSiteService(param, page)
            )
            .register<timer.site.SiteInfo, void>('site.addSite', info => addSite(info))
            .register<timer.site.SiteKey[], void>('site.removeSites', keys => removeSites(...keys))
            .register<{ key: timer.site.SiteKey; cateId: number | undefined }, void>('site.saveSiteCate', ({ key, cateId }) => saveSiteCate(key, cateId))
            .register<{ cateId: number | undefined; keys: timer.site.SiteKey[] }, void>('site.batchSaveSiteCate', ({ cateId, keys }) => batchSaveSiteCate(cateId, keys))
            .register<timer.site.SiteKey, void>('site.removeIconUrl', key => removeIconUrl(key))
            .register<{ key: timer.site.SiteKey; run: boolean }, void>('site.saveSiteRunState', ({ key, run }) => saveSiteRunState(key, run))
            .register<timer.site.SiteKey[], timer.site.SiteInfo[]>('site.batchGetSites', keys => batchGetSites(keys))
            .register<Array<{ key: timer.site.SiteKey; alias: string }>, void>('site.batchSaveAliasNoRewrite', arr => {
                const siteMap = new SiteMap<string>()
                arr.forEach(({ key, alias }) => siteMap.put(key, alias))
                return batchSaveAliasNoRewrite(siteMap)
            })
            .register<timer.site.SiteKey, void>('site.removeAlias', key => removeAlias(key))
            .register<{ key: timer.site.SiteKey; alias: string; noRewrite?: boolean }, void>('site.saveAlias', ({ key, alias, noRewrite }) => saveAlias(key, alias, noRewrite))
            .register<void, timer.option.AllOption>('option.get', () => optionHolder.get())
            .register<Partial<timer.option.AllOption>, void>('option.set', data => optionHolder.set(data))
            .register<timer.option.AppearanceOption | undefined, boolean>('option.isDarkMode', val => optionService.isDarkMode(val))
            .register<{ mode: timer.option.DarkMode; period?: [number, number] }, void>('option.setDarkMode', ({ mode, period }) => optionService.setDarkMode(mode, period))
            .register<timer.option.LocaleOption, void>('option.setLocale', locale => optionService.setLocale(locale))
            .register<Partial<timer.option.BackupOption>, void>('option.setBackupOption', opt => optionService.setBackupOption(opt))
            .register<void, timer.site.Cate[]>('cate.listAll', () => cateService.listAll())
            .register<string, timer.site.Cate>('cate.add', name => cateService.add(name))
            .register<{ id: number; name: string }, void>('cate.saveName', ({ id, name }) => cateService.saveName(id, name))
            .register<number, void>('cate.remove', id => cateService.remove(id))
            .register<timer.ExtensionMetaFlag, void>('meta.saveFlag', flag => saveFlag(flag))
            .register<void, string | undefined>('meta.getCid', () => getCid())
            .register<string, void>('meta.increaseApp', routePath => increaseApp(routePath))
            .register<void, void>('meta.increasePopup', () => increasePopup())
            .register<void, boolean>('meta.recommendRate', () => recommendRate())
            .register<{ filterDisabled?: boolean; url?: string; id?: number } | undefined, timer.limit.Item[]>(
                'limit.select',
                cond => limitService.select(cond ? { filterDisabled: cond.filterDisabled ?? false, url: cond.url, id: cond.id } : undefined)
            )
            .register<timer.limit.Item | timer.limit.Item[], void>('limit.remove', data => {
                const items = Array.isArray(data) ? data : [data]
                return limitService.remove(...items)
            })
            .register<timer.limit.Item[], void>('limit.updateEnabled', items => limitService.updateEnabled(...items))
            .register<timer.limit.Item, void>('limit.updateDelay', item => limitService.updateDelay(item))
            .register<timer.limit.Item, void>('limit.updateLocked', item => limitService.updateLocked(item))
            .register<{ difficulty: timer.limit.VerificationDifficulty; locale: timer.Locale }, VerificationPair | null>(
                'limit.verify',
                ({ difficulty, locale }) => Promise.resolve(verificationProcessor.generate(difficulty, locale))
            )
            .register<timer.limit.Rule[], void>('limit.update', rules => limitService.update(...rules))
            .register<Partial<timer.limit.Rule>, number>('limit.create', rule => limitService.create(rule as MakeOptional<timer.limit.Rule, 'id'>))
            .register<void, string[]>('whitelist.listAll', () => whitelistService.listAll())
            .register<string, void>('whitelist.add', white => whitelistService.add(white))
            .register<string, void>('whitelist.remove', white => whitelistService.remove(white))
            .register<void, { success: boolean; errorMsg?: string; data?: number }>('backup.syncData', () => backupProcessor.syncData())
            .register<void, { errorMsg?: string }>('backup.checkAuth', async () => {
                const result = await backupProcessor.checkAuth()
                return { errorMsg: result.errorMsg }
            })
            .register<string, { success: boolean; errorMsg?: string }>('backup.clear', cid => backupProcessor.clear(cid))
            .register<RemoteQueryParam, timer.backup.Row[]>('backup.query', param => backupProcessor.query(param))
            .register<timer.backup.Type, { ts: number; msg?: string } | undefined>('backup.getLastBackUp', type => getLastBackUp(type))
            .register<void, { success: boolean; errorMsg?: string; data?: timer.backup.Client[] }>('backup.listClients', () => backupProcessor.listClients())
            .register<{ periods: timer.period.Result[]; config: { start: timer.period.Key; end: timer.period.Key; periodSize: number } }, timer.period.Row[]>(
                'period.merge',
                ({ periods, config }) => Promise.resolve(merge(periods, config))
            )
            .register<{ periodRange: timer.period.KeyRange }, timer.period.Result[]>('period.listBetween', param => periodService.listBetween(param))
            .register<timer.imported.Row[], void>('import.fillExist', rows => fillExist(rows))
            .register<{ data: timer.imported.Data; resolution: timer.imported.ConflictResolution }, void>(
                'import.processImportedData',
                ({ data, resolution }) => processImportedData(data, resolution)
            )
            .register<unknown, void>('immigration.importData', data => immigration.importData(data))
            .register<void, timer.backup.ExportData>('immigration.exportData', () => immigration.exportData())
            .register<void, MemoryInfo>('memory.getUsedStorage', () => getUsedStorage())
    }

    private async handle(message: timer.mq.Request<unknown>, sender: ChromeMessageSender): Promise<timer.mq.Response<unknown>> {
        const code = message?.code
        if (!code) {
            return { code: 'ignore' }
        }
        const handler = this.handlers[code]
        if (!handler) {
            return { code: 'ignore' }
        }
        try {
            const result = await handler(message.data, sender)
            return { code: 'success', data: result }
        } catch (error) {
            const msg = error instanceof Error ? error.message : error?.toString?.()
            return { code: 'fail', msg }
        }
    }

    start() {
        onRuntimeMessage((msg, sender) => this.handle(msg, sender))
    }
}

export default MessageDispatcher