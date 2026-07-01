/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { log } from '@/common/logger'
import { onRuntimeMessage } from "@api/chrome/runtime"
import focusPresetDatabase from "@db/focus-preset-database"
import focusHolder from '@service/focus/holder'
import cateDatabase from './database/cate-database'
import { getUsedStorage } from './database/memory-detector'
import mergeRuleDatabase from "./database/merge-rule-database"
import siteDatabase from './database/site-database'
import statDatabase from './database/stat-database'
import { check2faCode, prepare2fa } from "./service/2fa-service"
import backupProcessor from "./service/backup/processor"
import { exportData, importData, migrateStorage } from "./service/components/immigration"
import { importOther, previewBackup } from "./service/components/import-processor"
import optionHolder from "./service/components/option-holder"
import { getWeekStartDay, getWeekStartTime } from "./service/components/week-helper"
import { handleAction, saveLastPopup } from "./service/focus"
import { getTodayResult } from './service/item-service'
import { getInstallTime, getLastBackUp } from "./service/meta-service"
import notificationProcessor from './service/notification/processor'
import { selectPeriods } from "./service/period-service"
import {
    addSite, batchChangeCate, fillInitialAlias, getInitialAlias, getSite, removeSites, saveSite, saveSiteRunState, searchSites,
    selectSitePage,
} from "./service/site-service"
import {
    batchDelete, countGroup, countSite, selectCate, selectCatePage, selectGroup, selectGroupPage, selectSite,
    selectSitePage as selectStateSitePage,
} from "./service/stat-service"
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
    private handlers: Partial<Record<tt4b.mq.ReqCode, tt4b.mq.Handler<tt4b.mq.ReqCode>>> = {}

    constructor() {
        this.initServiceHandlers()
    }

    register<C extends tt4b.mq.ReqCode>(code: C, handler: tt4b.mq.Handler<C>): MessageDispatcher {
        if (this.handlers[code]) {
            throw new Error(`Duplicate handler: code=${code}`)
        }
        this.handlers[code] = handler as unknown as tt4b.mq.Handler<tt4b.mq.ReqCode>
        return this
    }

    private initServiceHandlers() {
        this
            // Statistics
            .register('stat.sites', selectSite)
            .register('stat.sitePage', selectStateSitePage)
            .register('stat.countSite', countSite)
            .register('stat.deleteSite', param => 'host' in param
                ? statDatabase.deleteByHost(param.host, param.date)
                : statDatabase.deleteByGroup(param.groupId, param.date))
            .register('stat.cates', selectCate)
            .register('stat.catePage', selectCatePage)
            .register('stat.groups', selectGroup)
            .register('stat.groupPage', selectGroupPage)
            .register('stat.countGroup', countGroup)
            .register('stat.batchDelete', batchDelete)
            .register('stat.today', getTodayResult)
            .register('item.batch', keys => statDatabase.batchSelect(keys))
            // Site management
            .register('site.list', param => siteDatabase.select(param))
            .register('site.page', selectSitePage)
            .register('site.add', addSite)
            .register('site.delete', removeSites)
            .register('site.changeCate', ({ cateId, keys }) => batchChangeCate(cateId, keys))
            .register('site.modify', param => saveSite(param, true))
            .register('site.fillAlias', fillInitialAlias)
            .register('site.initialAlias', getInitialAlias)
            .register('site.changeRun', ({ key, enabled }) => saveSiteRunState(key, enabled))
            .register('site.runEnabled', host => getSite({ host, type: 'normal' }).then(s => !!s.run))
            .register('site.search', searchSites)
            // Options
            .register('option.get', () => optionHolder.get())
            .register('option.set', val => optionHolder.set(val))
            .register('option.sync', () => optionHolder.sync())
            .register('option.download', () => optionHolder.download())
            .register('option.changeStorage', migrateStorage)
            .register('option.testNotification', () => notificationProcessor.doSend())
            .register('option.weekStartDay', getWeekStartDay)
            .register('option.weekStartTime', getWeekStartTime)
            // Category
            .register('cate.all', () => cateDatabase.listAll())
            .register('cate.add', name => cateDatabase.add(name))
            .register('cate.change', ({ id, name }) => cateDatabase.update(id, name))
            .register('cate.delete', id => cateDatabase.delete(id))
            // Meta information
            .register('meta.installTs', getInstallTime)
            .register('meta.usedStorage', getUsedStorage)
            .register('meta.prepare2fa', prepare2fa)
            .register('meta.check2fa', check2faCode)
            .register('meta.popup', saveLastPopup)
            // Whitelist & Merge Rule
            .register('whitelist.contain', ({ host, url }) => whitelistHolder.contains(host, url))
            .register('whitelist.all', () => whitelistHolder.all())
            .register('whitelist.add', white => whitelistHolder.add(white))
            .register('whitelist.delete', white => whitelistHolder.remove(white))
            .register('whitelist.save', list => whitelistHolder.saveAll(list))
            // Merge rule
            .register('merge.all', () => mergeRuleDatabase.selectAll())
            .register('merge.delete', origin => mergeRuleDatabase.remove(origin))
            .register('merge.add', rule => mergeRuleDatabase.add(rule))
            // Backup
            .register('backup.sync', () => backupProcessor.syncData())
            .register('backup.checkAuth', () => backupProcessor.checkAuth().then(res => res.errorMsg))
            .register('backup.clear', cid => backupProcessor.clear(cid))
            .register('backup.query', param => backupProcessor.query(param))
            .register('backup.lastTs', getLastBackUp)
            .register('backup.clients', () => backupProcessor.listClients())
            .register('backup.preview', previewBackup)
            // Period & Timeline
            .register('period.list', selectPeriods)
            .register('timeline.list', listTimeline)
            .register('timeline.tick', ev => timelineThrottler.saveEvent(ev))
            // Focus
            .register('focus.allPresets', () => focusPresetDatabase.listAll())
            .register('focus.getPreset', id => focusPresetDatabase.getById(id))
            .register('focus.addPreset', data => focusPresetDatabase.add(data))
            .register('focus.savePreset', data => focusPresetDatabase.update(data))
            .register('focus.deletePreset', id => focusPresetDatabase.remove(id))
            .register('focus.action', handleAction)
            .register('focus.current', () => focusHolder.current)
            // Data immigration
            .register('immigration.import', importData)
            .register('immigration.export', exportData)
            .register('immigration.importOther', importOther)
    }

    private async handle(message: tt4b.mq.Request<tt4b.mq.ReqCode>, sender: ChromeMessageSender): Promise<tt4b.mq.Response<tt4b.mq.ReqCode>> {
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
            return { code: 'success', data: result } as tt4b.mq.Response<typeof code>
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