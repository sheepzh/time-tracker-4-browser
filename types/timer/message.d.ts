type _TransmitValue =
    | undefined
    | string
    | number
    | boolean
    | void
    | { readonly [key: string]: _TransmitValue }
    | readonly _TransmitValue[]

type _HandlerIO<Input extends _TransmitValue = undefined, Output extends _TransmitValue = undefined> = [Input, Output]
type _MakeRegistry<Codes extends string, Param extends _TransmitValue = undefined, Result extends _TransmitValue = undefined> = Record<Codes, _HandlerIO<Param, Result>>

type _MqReqData<R, K extends keyof R> = R[K] extends [infer In, unknown] ? In : never
type _MqResData<R, K extends keyof R> = R[K] extends [unknown, infer Out] ? Out : never
type _MqRequest<R, K extends keyof R = keyof R> = { code: K; data: _MqReqData<R, K> }
type _MqSuccess<R, K extends keyof R> =
    _MqResData<R, K> extends undefined ? { code: "success"; data?: undefined } : { code: "success"; data: _MqResData<R, K> }
type _MqResponse<R, K extends keyof R = keyof R> =
    | { code: "fail"; msg: string }
    | { code: "ignore" }
    | (K extends keyof R ? _MqSuccess<R, K> : never)
type _MqHandler<R, C extends keyof R> = _MqResData<R, C> extends undefined
    ? (data: _MqReqData<R, C>, sender: chrome.runtime.MessageSender) => Awaitable<void | undefined>
    : (data: _MqReqData<R, C>, sender: chrome.runtime.MessageSender) => Awaitable<_MqResData<R, C>>

declare namespace timer.mq {
    type _HandlerRegistry =
        & _MakeRegistry<'cs.incVisitCount', { host: string; url: string }>
        & _MakeRegistry<'cs.trackTime' | 'cs.trackRunTime', timer.core.Event>
        & _MakeRegistry<'cs.onInjected' | 'cs.openAnalysis'>
        & _MakeRegistry<'cs.idleChange', boolean>
        & _MakeRegistry<'cs.getRunSites', string, timer.site.SiteKey | undefined>
        & _MakeRegistry<'cs.getAudible', undefined, boolean>
        // Statistics
        & _MakeRegistry<'stat.today', string, timer.core.Result | undefined>
        & _MakeRegistry<'stat.listSite', timer.stat.SiteQuery | undefined, timer.stat.SiteRow[]>
        & _MakeRegistry<'stat.getSitePage', timer.stat.SitePageQuery | undefined, timer.common.PageResult<timer.stat.SiteRow>>
        & _MakeRegistry<'stat.deleteSite', timer.stat.SiteDeleteQuery>
        & _MakeRegistry<'stat.countSite', timer.stat.SiteQuery | undefined, number>
        & _MakeRegistry<'stat.selectCate', timer.stat.CateQuery | undefined, timer.stat.CateRow[]>
        & _MakeRegistry<'stat.selectCatePage', timer.stat.CatePageQuery | undefined, timer.common.PageResult<timer.stat.CateRow>>
        & _MakeRegistry<'stat.countGroup', timer.stat.GroupQuery | undefined, number>
        & _MakeRegistry<'stat.selectGroup', timer.stat.GroupQuery | undefined, timer.stat.GroupRow[]>
        & _MakeRegistry<'stat.selectGroupPage', timer.stat.GroupPageQuery | undefined, timer.common.PageResult<timer.stat.GroupRow>>
        & _MakeRegistry<'stat.mergeDate', timer.stat.SiteRow[], timer.stat.SiteRow[]>
        & _MakeRegistry<'stat.batchDelete', timer.stat.Row[]>
        & _MakeRegistry<'stat.canReadRemote', undefined, boolean>
        // Category
        & _MakeRegistry<'cate.all', undefined, timer.site.Cate[]>
        & _MakeRegistry<'cate.add', string, timer.site.Cate>
        & _MakeRegistry<'cate.saveName', { id: number; name: string }>
        & _MakeRegistry<'cate.remove', number>
        // Option
        & _MakeRegistry<'option.get', undefined, timer.option.AllOption>
        & _MakeRegistry<'option.set', Partial<timer.option.AllOption>>
        & _MakeRegistry<'option.setDarkMode', Pick<timer.option.AppearanceOption, 'darkMode' | 'darkModeTimeStart' | 'darkModeTimeEnd'>>
        & _MakeRegistry<'option.setLocale', timer.option.LocaleOption>
        & _MakeRegistry<'option.setBackupOption', Partial<timer.option.BackupOption>>
        & _MakeRegistry<'option.migrateStorage', timer.option.StorageType>
        & _MakeRegistry<'option.testNotification', undefined, timer.common.Result<void>>
        & _MakeRegistry<'option.getWeekBounds', number, { start: number; end: number }>
        & _MakeRegistry<'option.getWeekStartDay', undefined, number>
        // Meta
        & _MakeRegistry<'meta.saveFlag', timer.ExtensionMetaFlag>
        & _MakeRegistry<'meta.getCid', undefined, string | undefined>
        & _MakeRegistry<'meta.increaseApp', string>
        & _MakeRegistry<'meta.increasePopup'>
        & _MakeRegistry<'meta.recommendRate', undefined, boolean>
        // Site
        & _MakeRegistry<'site.getSite', timer.site.SiteKey, timer.site.SiteInfo>
        & _MakeRegistry<'site.getPslSuffix', string, string>
        & _MakeRegistry<'site.selectAllSites', timer.site.Query | undefined, timer.site.SiteInfo[]>
        & _MakeRegistry<'site.selectSitePage', timer.site.PageQuery | undefined, timer.common.PageResult<timer.site.SiteInfo>>
        & _MakeRegistry<'site.addSite', timer.site.SiteInfo, timer.common.Result<void>>
        & _MakeRegistry<'site.removeSites', timer.site.SiteKey[]>
        & _MakeRegistry<'site.saveSiteCate', { key: timer.site.SiteKey; cateId: number | undefined }>
        & _MakeRegistry<'site.batchSaveSiteCate', { cateId: number | undefined; keys: timer.site.SiteKey[] }>
        & _MakeRegistry<'site.removeIconUrl' | 'site.removeAlias', timer.site.SiteKey>
        & _MakeRegistry<'site.saveSiteRunState', { key: timer.site.SiteKey; run: boolean }>
        & _MakeRegistry<'site.batchGetSites', timer.site.SiteKey[], timer.site.SiteInfo[]>
        & _MakeRegistry<'site.batchSaveAliasNoRewrite', Array<{ key: timer.site.SiteKey; alias: string }>>
        & _MakeRegistry<'site.saveAlias', { key: timer.site.SiteKey; alias: string; noRewrite?: boolean }>
        & _MakeRegistry<'site.searchHosts', string | undefined, timer.site.SiteInfo[]>
        // Time Limit
        & _MakeRegistry<'limit.list', timer.limit.Query | undefined, timer.limit.Item[]>
        & _MakeRegistry<'limit.batchRemove', timer.limit.Rule[]>
        & _MakeRegistry<'limit.batchUpdateEnabled', timer.limit.Rule[]>
        & _MakeRegistry<'limit.updateDelay' | 'limit.updateLocked' | 'limit.update', timer.limit.Rule>
        & _MakeRegistry<'limit.create', MakeOptional<timer.limit.Rule, 'id'>, number>
        & _MakeRegistry<'limit.listLimited' | 'limit.listEffective', string, timer.limit.Item[]>
        & _MakeRegistry<'limit.hitVisit', timer.limit.Item, boolean>
        & _MakeRegistry<'limit.delay', string>
        & _MakeRegistry<'limit.openRule', string>
        // Merge
        & _MakeRegistry<'merge.all', undefined, timer.merge.Rule[]>
        & _MakeRegistry<'merge.remove', string>
        & _MakeRegistry<'merge.add', timer.merge.Rule>
        // Whitelist
        & _MakeRegistry<'whitelist.all', undefined, string[]>
        & _MakeRegistry<'whitelist.add' | 'whitelist.remove', string>
        & _MakeRegistry<'whitelist.contain', { host: string; url: string }, boolean>
        // Backup
        & _MakeRegistry<'backup.syncData', undefined, { success: boolean; errorMsg?: string; data?: number }>
        & _MakeRegistry<'backup.checkAuth', undefined, { errorMsg?: string }>
        & _MakeRegistry<'backup.clear', string, { success: boolean; errorMsg?: string }>
        & _MakeRegistry<'backup.query', timer.backup.RemoteQuery, timer.backup.Row[]>
        & _MakeRegistry<'backup.getLastBackUp', timer.backup.Type, { ts: number; msg?: string } | undefined>
        & _MakeRegistry<'backup.listClients', undefined, { success: boolean; errorMsg?: string; data?: timer.backup.Client[] }>
        // Period
        & _MakeRegistry<'period.select', timer.period.Query, timer.period.Row[]>
        // Timeline
        & _MakeRegistry<'timeline.list', timer.timeline.Query, timer.timeline.Activity[]>
        & _MakeRegistry<'timeline.tick', timer.timeline.Event>
        & _MakeRegistry<'import.preview', timer.imported.PreviewQuery, timer.imported.Row[]>
        & _MakeRegistry<'import.processImportedData', timer.imported.ProcessQuery>
        & _MakeRegistry<'immigration.importData', any>
        & _MakeRegistry<'immigration.exportData', undefined, timer.backup.ExportData>
        & _MakeRegistry<'memory.getUsedStorage', undefined, timer.common.StorageUsage>

    type ReqCode = keyof _HandlerRegistry

    type ReqData<T extends ReqCode> = _MqReqData<_HandlerRegistry, T>

    /**
     * @since 0.2.2
     */
    type Request<T extends ReqCode = ReqCode> = _MqRequest<_HandlerRegistry, T>

    type ResData<T extends ReqCode> = _MqResData<_HandlerRegistry, T>

    /**
     * When ResData is undefined, success may omit data.
     * @since 0.8.4
     */
    type Response<T extends ReqCode = ReqCode> = _MqResponse<_HandlerRegistry, T>

    /**
     * @since 1.3.0
     */
    type Handler<C extends ReqCode> = _MqHandler<_HandlerRegistry, C>
    /**
     * @since 0.8.4
     */
    type Callback<T extends ReqCode = ReqCode> = (result?: Response<T>) => void
}

/**
 * Background → content script via chrome.tabs.sendMessage (see sendMsg2Tab).
 */
declare namespace timer.tab {
    type _HandlerRegistry =
        & _MakeRegistry<'siteRunChange'>
        & _MakeRegistry<'syncAudible', boolean>
        & _MakeRegistry<'limitTimeMeet' | 'limitWaking' | 'limitChanged', timer.limit.Item[]>
        & _MakeRegistry<'limitReminder', timer.limit.ReminderInfo>
        & _MakeRegistry<'askVisitTime', undefined, number>

    type ReqCode = keyof _HandlerRegistry

    type ReqData<T extends ReqCode> = _MqReqData<_HandlerRegistry, T>

    type ResData<T extends ReqCode> = _MqResData<_HandlerRegistry, T>

    type Request<T extends ReqCode = ReqCode> = _MqRequest<_HandlerRegistry, T>

    type Response<T extends ReqCode = ReqCode> = _MqResponse<_HandlerRegistry, T>

    /**
     * @since 0.8.4
     */
    type Callback<T extends ReqCode = ReqCode> = (result?: Response<T>) => void
}