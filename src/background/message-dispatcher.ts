/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getUsedStorage } from "@/background/database/memory-detector"
import { getSuffix } from '@/background/psl'
import backupProcessor from "@/background/service/backup/processor"
import immigration from "@/background/service/components/immigration"
import { fillExist, processImportedData } from "@/background/service/components/import-processor"
import optionHolder from "@/background/service/components/option-holder"
import limitService, { selectLimit } from "@/background/service/limit-service"
import { getCid, getLastBackUp, increaseApp, increasePopup, recommendRate, saveFlag } from "@/background/service/meta-service"
import { setBackupOption, setDarkMode, setLocale } from "@/background/service/option-service"
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
    countGroup,
    countSite,
    listHosts,
    selectCate,
    selectCatePage,
    selectGroup,
    selectGroupPage,
    selectSite,
    selectSitePage
} from "@/background/service/stat-service"
import { mergeDate } from "@/background/service/stat-service/merge/date"
import { canReadRemote } from "@/background/service/stat-service/remote"
import whitelistService from "@/background/service/whitelist/service"
import { onRuntimeMessage } from "@api/chrome/runtime"
import { SiteMap } from "@util/site"
import siteCateDatabase from './database/site-cate-database'

class MessageDispatcher {
    private handlers: Partial<Record<timer.mq.ReqCode, timer.mq.Handler<timer.mq.ReqCode>>> = {}

    constructor() {
        this.initServiceHandlers()
    }

    register<C extends timer.mq.ReqCode>(code: C, handler: timer.mq.Handler<C>): MessageDispatcher {
        if (this.handlers[code]) {
            throw new Error("Duplicate handler")
        }
        this.handlers[code] = handler as unknown as timer.mq.Handler<timer.mq.ReqCode>
        return this
    }

    private initServiceHandlers() {
        this
            .register('stat.selectSite', selectSite)
            .register('stat.selectSitePage', selectSitePage)
            .register('stat.countSite', countSite)
            .register('stat.selectCate', selectCate)
            .register('stat.selectCatePage', selectCatePage)
            .register('stat.selectGroup', selectGroup)
            .register('stat.selectGroupPage', selectGroupPage)
            .register('stat.countGroup', countGroup)
            .register('stat.listHosts', listHosts)
            .register('stat.mergeDate', mergeDate)
            .register('stat.batchDelete', batchDelete)
            .register('stat.canReadRemote', canReadRemote)
            .register('stat.recommendRate', recommendRate)
            .register('site.getPslSuffix', getSuffix)
            .register('site.getSite', getSite)
            .register('site.selectAllSites', selectAllSites)
            .register('site.selectSitePage', ({ param, page }) => selectSitePageInSiteService(param, page))
            .register('site.addSite', addSite)
            .register('site.removeSites', keys => removeSites(...keys))
            .register('site.saveSiteCate', ({ key, cateId }) => saveSiteCate(key, cateId))
            .register('site.batchSaveSiteCate', ({ cateId, keys }) => batchSaveSiteCate(cateId, keys))
            .register('site.removeIconUrl', removeIconUrl)
            .register('site.saveSiteRunState', ({ key, run }) => saveSiteRunState(key, run))
            .register('site.batchGetSites', batchGetSites)
            .register('site.batchSaveAliasNoRewrite', arr => {
                const siteMap = new SiteMap<string>()
                arr.forEach(({ key, alias }) => siteMap.put(key, alias))
                batchSaveAliasNoRewrite(siteMap)
            })
            .register('site.removeAlias', removeAlias)
            .register('site.saveAlias', ({ key, alias, noRewrite }) => saveAlias(key, alias, noRewrite))
            .register('option.get', () => optionHolder.get())
            .register('option.set', val => optionHolder.set(val))
            .register('option.setDarkMode', ({ mode, period }) => setDarkMode(mode, period))
            .register('option.setLocale', setLocale)
            .register('option.setBackupOption', setBackupOption)
            .register('cate.listAll', () => siteCateDatabase.listAll())
            .register('cate.add', name => siteCateDatabase.add(name))
            .register('cate.saveName', ({ id, name }) => siteCateDatabase.update(id, name))
            .register('cate.remove', id => siteCateDatabase.delete(id))
            .register('meta.saveFlag', saveFlag)
            .register('meta.getCid', () => getCid())
            .register('meta.increaseApp', increaseApp)
            .register('meta.increasePopup', increasePopup)
            .register('meta.recommendRate', recommendRate)
            .register('limit.select', selectLimit)
            .register('limit.remove', data => {
                const items = Array.isArray(data) ? data : [data]
                limitService.remove(...items)
            })
            .register('limit.updateEnabled', items => limitService.updateEnabled(...items))
            .register('limit.updateDelay', item => limitService.updateDelay(item))
            .register('limit.updateLocked', item => limitService.updateLocked(item))
            .register('limit.update', rules => limitService.update(...rules))
            .register('limit.create', rule => limitService.create(rule as MakeOptional<timer.limit.Rule, 'id'>))
            .register('whitelist.listAll', () => whitelistService.listAll())
            .register('whitelist.add', whitelistService.add)
            .register('whitelist.remove', whitelistService.remove)
            .register('backup.syncData', () => backupProcessor.syncData())
            .register('backup.checkAuth', async () => {
                const result = await backupProcessor.checkAuth()
                return { errorMsg: result.errorMsg }
            })
            .register('backup.clear', cid => backupProcessor.clear(cid))
            .register('backup.query', param => backupProcessor.query(param))
            .register('backup.getLastBackUp', type => getLastBackUp(type))
            .register('backup.listClients', () => backupProcessor.listClients())
            .register('period.listBetween', param => periodService.listBetween(param))
            .register('import.fillExist', rows => fillExist(rows))
            .register('import.processImportedData', ({ data, resolution }) => processImportedData(data, resolution))
            .register('immigration.importData', data => immigration.importData(data))
            .register('immigration.exportData', () => immigration.exportData())
            .register('memory.getUsedStorage', getUsedStorage)
    }

    private async handle(message: timer.mq.Request<timer.mq.ReqCode>, sender: ChromeMessageSender): Promise<timer.mq.Response<timer.mq.ReqCode>> {
        const code = message?.code
        if (!code) {
            return { code: 'ignore' }
        }
        const handler = this.handlers[code]
        if (!handler) {
            console.warn(`Handler not registered for code: ${code}`)
            return { code: 'ignore' }
        }
        try {
            const result = await handler(message.data, sender)
            return { code: 'success', data: result } as timer.mq.Response<typeof code>
        } catch (error) {
            const msg = error instanceof Error ? error.message : (error?.toString?.() ?? 'Unknown error')
            return { code: 'fail', msg }
        }
    }

    start() {
        onRuntimeMessage((msg, sender) => this.handle(msg, sender))
    }
}

export default MessageDispatcher