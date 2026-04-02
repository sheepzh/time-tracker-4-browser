/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { log } from '@/common/logger'
import { onRuntimeMessage } from "@api/chrome/runtime"
import cateDatabase from './database/cate-database'
import { getUsedStorage } from "./database/memory-detector"
import mergeRuleDatabase from "./database/merge-rule-database"
import siteDatabase from './database/site-database'
import statDatabase from './database/stat-database'
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
    addSite, batchChangeCate, fillInitialAlias, getInitialAlias, getSite, removeIconUrl,
    removeSites,
    saveAlias,
    saveSiteRunState, searchSites, selectSitePage
} from "./service/site-service"
import {
    batchDelete, countGroup, countSite,
    selectCate, selectCatePage, selectGroup, selectGroupPage,
    selectSite, selectSitePage as selectStateSitePage
} from "./service/stat-service"
import { mergeDate } from "./service/stat-service/merge/date"
import timelineThrottler from './service/throttler/timeline-throttler'
import { listTimeline } from "./service/timeline-service"
import whitelistHolder from './service/whitelist/holder'

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
            .register('stat.deleteSite', param => 'host' in param
                ? statDatabase.deleteByHost(param.host, param.date)
                : statDatabase.deleteByGroup(param.groupId, param.date))
            .register('stat.selectCate', selectCate)
            .register('stat.selectCatePage', selectCatePage)
            .register('stat.selectGroup', selectGroup)
            .register('stat.selectGroupPage', selectGroupPage)
            .register('stat.countGroup', countGroup)
            .register('stat.mergeDate', mergeDate)
            .register('stat.batchDelete', batchDelete)
            .register('stat.today', getTodayResult)
            // Site management
            .register('site.all', param => siteDatabase.select(param))
            .register('site.page', selectSitePage)
            .register('site.add', addSite)
            .register('site.delete', removeSites)
            .register('site.changeCate', ({ cateId, keys }) => batchChangeCate(cateId, keys))
            .register('site.deleteIcon', removeIconUrl)
            .register('site.changeAlias', ({ key, alias }) => saveAlias(key, alias))
            .register('site.fillAlias', fillInitialAlias)
            .register('site.initialAlias', getInitialAlias)
            .register('site.changeRun', ({ key, enabled }) => saveSiteRunState(key, enabled))
            .register('site.runEnabled', host => getSite({ host, type: 'normal' }).then(s => !!s.run))
            .register('site.search', searchSites)
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
            .register('cate.all', () => cateDatabase.listAll())
            .register('cate.add', name => cateDatabase.add(name))
            .register('cate.saveName', ({ id, name }) => cateDatabase.update(id, name))
            .register('cate.remove', id => cateDatabase.delete(id))
            // Meta information
            .register('meta.saveFlag', saveFlag)
            .register('meta.getCid', getCid)
            .register('meta.increaseApp', increaseApp)
            .register('meta.increasePopup', increasePopup)
            .register('meta.recommendRate', recommendRate)
            // Whitelist & Merge Rule
            .register('whitelist.contain', ({ host, url }) => whitelistHolder.contains(host, url))
            .register('whitelist.all', () => whitelistHolder.all())
            .register('whitelist.add', white => whitelistHolder.add(white))
            .register('whitelist.remove', white => whitelistHolder.remove(white))
            // Merge rule
            .register('merge.all', () => mergeRuleDatabase.selectAll())
            .register('merge.remove', origin => mergeRuleDatabase.remove(origin))
            .register('merge.add', rule => mergeRuleDatabase.add(rule))
            // Backup
            .register('backup.syncData', () => backupProcessor.syncData())
            .register('backup.checkAuth', () => backupProcessor.checkAuth().then(res => res.errorMsg))
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