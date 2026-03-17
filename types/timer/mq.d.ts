/**
* Message queue
*/
declare namespace timer.mq {
    type ReqCode =
        | 'openLimitPage'
        | 'limitTimeMeet'
        // @since 0.9.0
        | 'limitWaking'
        // @since 1.2.3
        | 'limitChanged'
        // @since 3.1.0
        | 'limitReminder'
        // @since 2.0.0
        | 'askVisitTime'
        | 'askHitVisit'
        // @since 3.2.0
        | 'siteRunChange'
        // @since 3.5.0
        | "enableTabGroup"
        // @since 3.7.3
        | "syncAudible"
        | "resetBackupScheduler"
        // @since 4.1.0
        | "resetNotificationScheduler"
        // Request by content script
        // @since 1.3.0
        | "cs.isInWhitelist"
        | "cs.incVisitCount"
        | "cs.printTodayInfo"
        | "cs.getTodayInfo"
        | "cs.moreMinutes"
        | "cs.getLimitedRules"
        | "cs.getRelatedRules"
        | "cs.trackTime"
        | "cs.trackRunTime"
        | "cs.onInjected"
        | "cs.openAnalysis"
        | "cs.openLimit"
        // @since 2.5.5
        | "cs.idleChange"
        // @since 3.2.0
        | "cs.getRunSites"
        // @since 3.6.1
        | "cs.timelineEv"
        // @since 3.7.3
        | "cs.getAudible"
        // Stat domain (CS architecture)
        | 'stat.selectSite'
        | 'stat.selectSitePage'
        | 'stat.selectCate'
        | 'stat.selectCatePage'
        | 'stat.selectGroup'
        | 'stat.selectGroupPage'
        | 'stat.listHosts'
        | 'stat.mergeDate'
        | 'stat.batchDelete'
        | 'stat.countGroupByIds'
        | 'stat.countSiteByHosts'
        | 'stat.canReadRemote'
        | 'stat.recommendRate'
        // Option / Cate / Meta (Wave 2)
        | 'option.get'
        | 'option.set'
        | 'option.isDarkMode'
        | 'option.setDarkMode'
        | 'option.setLocale'
        | 'option.setBackupOption'
        | 'cate.listAll'
        | 'cate.add'
        | 'cate.saveName'
        | 'cate.remove'
        | 'meta.saveFlag'
        | 'meta.getCid'
        | 'meta.increaseApp'
        | 'meta.increasePopup'
        | 'meta.recommendRate'
        // Site (Wave 3)
        | 'site.getSite'
        | 'site.selectAllSites'
        | 'site.selectSitePage'
        | 'site.addSite'
        | 'site.removeSites'
        | 'site.saveSiteCate'
        | 'site.batchSaveSiteCate'
        | 'site.removeIconUrl'
        | 'site.saveSiteRunState'
        | 'site.batchGetSites'
        | 'site.batchSaveAliasNoRewrite'
        | 'site.removeAlias'
        | 'site.saveAlias'
        // Limit / Whitelist / Backup (Wave 4)
        | 'limit.select'
        | 'limit.remove'
        | 'limit.updateEnabled'
        | 'limit.updateDelay'
        | 'limit.updateLocked'
        | 'limit.verify'
        | 'limit.update'
        | 'limit.create'
        | 'whitelist.listAll'
        | 'whitelist.add'
        | 'whitelist.remove'
        | 'backup.syncData'
        | 'backup.checkAuth'
        | 'backup.clear'
        | 'backup.query'
        | 'backup.getLastBackUp'
        | 'backup.listClients'
        // Period / Import / Immigration / Memory (Wave 5)
        | 'period.merge'
        | 'import.fillExist'
        | 'import.processImportedData'
        | 'immigration.importData'
        | 'immigration.exportData'
        | 'period.listBetween'
        | 'memory.getUsedStorage'

    type ResCode = "success" | "fail" | "ignore"

    /**
     * @since 0.2.2
     */
    type Request<T = any> = {
        code: ReqCode
        data?: T
    }
    /**
     * @since 0.8.4
     */
    type Response<T = any> = {
        code: ResCode,
        msg?: string
        data?: T
    }
    /**
     * @since 1.3.0
     */
    type Handler<Req, Res> = (data: Req, sender: chrome.runtime.MessageSender) => Promise<Res> | Res
    /**
     * @since 0.8.4
     */
    type Callback<T = any> = (result?: Response<T>) => void
}