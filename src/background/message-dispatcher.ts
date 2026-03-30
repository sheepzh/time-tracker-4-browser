/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { log } from '@/common/logger'
import { onRuntimeMessage } from "@api/chrome/runtime"
import { SiteMap } from "@util/site"
import { getUsedStorage } from "./database/memory-detector"
import mergeRuleDatabase from "./database/merge-rule-database"
import siteCateDatabase from './database/site-cate-database'
import statDatabase from './database/stat-database'
import { getSuffix } from './psl'
import backupProcessor from "./service/backup/processor"
import immigration from "./service/components/immigration"
import { previewImport, processImportedData } from "./service/components/import-processor"
import optionHolder from "./service/components/option-holder"
import weekHelper from "./service/components/week-helper"
import { getTodayResult } from './service/item-service'
import { getCid, getLastBackUp, increaseApp, increasePopup, recommendRate, saveFlag } from "./service/meta-service"
import processor from './service/notification/processor'
import { setBackupOption, setDarkMode, setLocale } from "./service/option-service"
import { selectPeriods } from "./service/period-service"
import {
    addSite, batchGetSites, batchSaveAliasNoRewrite, batchSaveSiteCate, getSite, removeAlias, removeIconUrl,
    removeSites, saveAlias, saveSiteCate, saveSiteRunState, searchHosts, selectAllSites, selectSitePage,
} from "./service/site-service"
import {
    batchDelete, countGroup, countSite,
    selectCate, selectCatePage, selectGroup, selectGroupPage,
    selectSite, selectSitePage as selectStateSitePage
} from "./service/stat-service"
import { mergeDate } from "./service/stat-service/merge/date"
import { canReadRemote } from "./service/stat-service/remote"
import timelineThrottler from './service/throttler/timeline-throttler'
import { listTimeline } from "./service/timeline-service"
import whitelistService from "./service/whitelist/service"

function processParam(param: unknown): unknown {
    if (param === null || param === undefined) {
        return undefined
    }
    const startTs = Date.now()
    // Convert null to undefined, because null can't be serialized in chrome.runtime.sendMessage
    const json = JSON.stringify(param)
    const result = JSON.parse(json, (_key, val) => val ?? undefined)
    log(`Processed param in ${Date.now() - startTs}ms`)
    return result
}

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
            // Statistics
            .register('stat.listSite', selectSite)
            .register('stat.getSitePage', selectStateSitePage)
            .register('stat.countSite', countSite)
            .register('stat.deleteSiteByHost', param => statDatabase.deleteByHost(param))
            .register('stat.deleteSiteByGroup', param => statDatabase.deleteByGroup(param))
            .register('stat.selectCate', selectCate)
            .register('stat.selectCatePage', selectCatePage)
            .register('stat.selectGroup', selectGroup)
            .register('stat.selectGroupPage', selectGroupPage)
            .register('stat.countGroup', countGroup)
            .register('stat.mergeDate', mergeDate)
            .register('stat.batchDelete', batchDelete)
            .register('stat.canReadRemote', canReadRemote)
            .register('stat.today', getTodayResult)
            // Site management
            .register('site.getPslSuffix', getSuffix)
            .register('site.getSite', getSite)
            .register('site.selectAllSites', selectAllSites)
            .register('site.selectSitePage', selectSitePage)
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
            .register('site.searchHosts', searchHosts)
            // Options
            .register('option.get', () => optionHolder.get())
            .register('option.set', val => optionHolder.set(val))
            .register('option.setDarkMode', setDarkMode)
            .register('option.setLocale', setLocale)
            .register('option.setBackupOption', setBackupOption)
            .register('option.migrateStorage', type => immigration.migrateStorage(type))
            .register('option.testNotification', () => processor.doSend())
            .register('option.getWeekBounds', ts => weekHelper.getWeekDate(ts))
            .register('option.getWeekStartDay', () => weekHelper.getRealWeekStart())
            // Category
            .register('cate.all', () => siteCateDatabase.listAll())
            .register('cate.add', name => siteCateDatabase.add(name))
            .register('cate.saveName', ({ id, name }) => siteCateDatabase.update(id, name))
            .register('cate.remove', id => siteCateDatabase.delete(id))
            // Meta information
            .register('meta.saveFlag', saveFlag)
            .register('meta.getCid', getCid)
            .register('meta.increaseApp', increaseApp)
            .register('meta.increasePopup', increasePopup)
            .register('meta.recommendRate', recommendRate)
            // Whitelist & Merge Rule
            .register('whitelist.listAll', () => whitelistService.listAll())
            .register('whitelist.add', whitelistService.add)
            .register('whitelist.remove', whitelistService.remove)
            .register('mergeRule.selectAll', () => mergeRuleDatabase.selectAll())
            .register('mergeRule.remove', origin => mergeRuleDatabase.remove(origin))
            .register('mergeRule.add', rule => mergeRuleDatabase.add(rule))
            // Backup
            .register('backup.syncData', () => backupProcessor.syncData())
            .register('backup.checkAuth', async () => {
                const result = await backupProcessor.checkAuth()
                return { errorMsg: result.errorMsg }
            })
            .register('backup.clear', cid => backupProcessor.clear(cid))
            .register('backup.query', param => backupProcessor.query(param))
            .register('backup.getLastBackUp', type => getLastBackUp(type))
            .register('backup.listClients', () => backupProcessor.listClients())
            // Period & Timeline
            .register('period.select', selectPeriods)
            .register('timeline.list', listTimeline)
            .register('timeline.tick', ev => timelineThrottler.saveEvent(ev))
            // Data immigration
            .register('import.preview', req => previewImport(req))
            .register('import.processImportedData', processImportedData)
            .register('immigration.importData', data => immigration.importData(data))
            .register('immigration.exportData', () => immigration.exportData())
            .register('memory.getUsedStorage', getUsedStorage)
    }

    private async handle(message: timer.mq.Request<timer.mq.ReqCode>, sender: ChromeMessageSender): Promise<timer.mq.Response<timer.mq.ReqCode>> {
        const code = message?.code
        if (!code) {
            return { code: 'ignore' }
        }
        log(`Received message: ${code} with data: `, message?.data)
        const handler = this.handlers[code]
        if (!handler) {
            console.warn(`Handler not registered for code: ${code}`)
            return { code: 'ignore' }
        }
        try {
            const data = processParam(message.data)
            const result = await handler(data, sender)
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