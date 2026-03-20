type _TransmitValue =
    | undefined
    | string
    | number
    | boolean
    | { readonly [key: string]: _TransmitValue }
    | readonly _TransmitValue[]

type _HandlerIO<Input extends _TransmitValue = undefined, Output extends _TransmitValue = undefined> = [Input, Output]
type _MakeRegistry<Codes extends string, Param extends _TransmitValue = undefined, Result extends _TransmitValue = undefined> = Record<Codes, _HandlerIO<Param, Result>>

/** Derive request/response/handler types from a handler registry (Record of [Req, Res] tuples). */
type _MqReqData<R, K extends keyof R> = R[K] extends [infer In, unknown] ? In : never
type _MqResData<R, K extends keyof R> = R[K] extends [unknown, infer Out] ? Out : never
type _MqRequest<R, K extends keyof R = keyof R> = { code: K; data: _MqReqData<R, K> }
/** Single-code success shape (ResData is per-key, not a union over all codes). */
type _MqSuccess<R, K extends keyof R> =
    _MqResData<R, K> extends undefined ? { code: "success"; data?: undefined } : { code: "success"; data: _MqResData<R, K> }
/** K must distribute over unions (e.g. ReqCode) so optional success data is correct per code. */
type _MqResponse<R, K extends keyof R = keyof R> =
    | { code: "fail"; msg: string }
    | { code: "ignore" }
    | (K extends keyof R ? _MqSuccess<R, K> : never)
type _MqHandler<R, C extends keyof R> = _MqResData<R, C> extends undefined
    ? (data: _MqReqData<R, C>, sender: chrome.runtime.MessageSender) => Awaitable<void | undefined>
    : (data: _MqReqData<R, C>, sender: chrome.runtime.MessageSender) => Awaitable<_MqResData<R, C>>

/**
 * Message queue
 */
declare namespace timer.mq {
    /**
     * Background → content script via chrome.tabs.sendMessage (see sendMsg2Tab).
     */
    namespace tab {
        type TabHandlerRegistry =
            & _MakeRegistry<'siteRunChange'>
            & _MakeRegistry<'syncAudible', boolean>
            & _MakeRegistry<'limitTimeMeet' | 'limitWaking' | 'limitChanged', timer.limit.Item[]>
            & _MakeRegistry<'limitReminder', timer.limit.ReminderInfo>
            & _MakeRegistry<'askVisitTime', undefined, number>

        type TabCode = keyof TabHandlerRegistry

        type TabReqData<T extends TabCode> = _MqReqData<TabHandlerRegistry, T>

        type TabResData<T extends TabCode> = _MqResData<TabHandlerRegistry, T>

        type TabRequest<T extends TabCode = TabCode> = _MqRequest<TabHandlerRegistry, T>

        type TabResponse<T extends TabCode = TabCode> = _MqResponse<TabHandlerRegistry, T>

        /**
         * @since 0.8.4
         */
        type Callback<T extends TabCode = TabCode> = (result?: TabResponse<T>) => void
    }

    type _HandlerRegistry =
        & _MakeRegistry<'askHitVisit', timer.limit.Item, boolean>
        & _MakeRegistry<'enableTabGroup' | 'resetBackupScheduler' | 'resetNotificationScheduler'>
        & _MakeRegistry<'cs.isInWhitelist', { host?: string; url?: string }, boolean>
        & _MakeRegistry<'cs.incVisitCount', { host: string; url: string }>
        & _MakeRegistry<'cs.printTodayInfo', undefined, boolean>
        & _MakeRegistry<'cs.getTodayInfo', string, timer.core.Result>
        & _MakeRegistry<'cs.moreMinutes', string>
        & _MakeRegistry<'cs.getLimitedRules' | 'cs.getRelatedRules', string, timer.limit.Item[]>
        & _MakeRegistry<'cs.trackTime' | 'cs.trackRunTime', timer.core.Event>
        & _MakeRegistry<'cs.onInjected' | 'cs.openAnalysis' | 'cs.openLimit'>
        & _MakeRegistry<'cs.idleChange', boolean>
        & _MakeRegistry<'cs.getRunSites', string, timer.site.SiteKey | undefined>
        & _MakeRegistry<'cs.timelineEv', timer.timeline.Event>
        & _MakeRegistry<'cs.getAudible', undefined, boolean>
        // stat
        & _MakeRegistry<'stat.selectSite', timer.stat.SiteQuery | undefined, timer.stat.SiteRow[]>
        & _MakeRegistry<'stat.selectSitePage', timer.stat.SitePageQuery | undefined, timer.common.PageResult<timer.stat.SiteRow>>
        & _MakeRegistry<'stat.countSite', timer.stat.SiteQuery | undefined, number>
        & _MakeRegistry<'stat.selectCate', timer.stat.CateQuery | undefined, timer.stat.CateRow[]>
        & _MakeRegistry<'stat.selectCatePage', timer.stat.CatePageQuery | undefined, timer.common.PageResult<timer.stat.CateRow>>
        & _MakeRegistry<'stat.countGroup', timer.stat.GroupQuery | undefined, number>
        & _MakeRegistry<'stat.selectGroup', timer.stat.GroupQuery | undefined, timer.stat.GroupRow[]>
        & _MakeRegistry<'stat.selectGroupPage', timer.stat.GroupPageQuery | undefined, timer.common.PageResult<timer.stat.GroupRow>>
        & _MakeRegistry<'stat.listHosts', string | undefined, Record<timer.site.Type, string[]>>
        & _MakeRegistry<'stat.mergeDate', timer.stat.SiteRow[], timer.stat.SiteRow[]>
        & _MakeRegistry<'stat.batchDelete', timer.stat.Row[]>
        & _MakeRegistry<'stat.canReadRemote' | 'stat.recommendRate', undefined, boolean>
        // option / cate / meta
        & _MakeRegistry<'option.get', undefined, timer.option.AllOption>
        & _MakeRegistry<'option.set', Partial<timer.option.AllOption>>
        & _MakeRegistry<'option.setDarkMode', { mode: timer.option.DarkMode; period?: [number, number] }>
        & _MakeRegistry<'option.setLocale', timer.option.LocaleOption>
        & _MakeRegistry<'option.setBackupOption', Partial<timer.option.BackupOption>>
        & _MakeRegistry<'cate.listAll', undefined, timer.site.Cate[]>
        & _MakeRegistry<'cate.add', string, timer.site.Cate>
        & _MakeRegistry<'cate.saveName', { id: number; name: string }>
        & _MakeRegistry<'cate.remove', number>
        & _MakeRegistry<'meta.saveFlag', timer.ExtensionMetaFlag>
        & _MakeRegistry<'meta.getCid', undefined, string | undefined>
        & _MakeRegistry<'meta.increaseApp', string>
        & _MakeRegistry<'meta.increasePopup'>
        & _MakeRegistry<'meta.recommendRate', undefined, boolean>
        // site
        & _MakeRegistry<'site.getSite', timer.site.SiteKey, timer.site.SiteInfo>
        & _MakeRegistry<'site.getPslSuffix', string, string>
        & _MakeRegistry<'site.selectAllSites', timer.site.SiteListQuery | undefined, timer.site.SiteInfo[]>
        & _MakeRegistry<'site.selectSitePage', timer.site.SiteSelectPageQuery, timer.common.PageResult<timer.site.SiteInfo>>
        & _MakeRegistry<'site.addSite', timer.site.SiteInfo>
        & _MakeRegistry<'site.removeSites', timer.site.SiteKey[]>
        & _MakeRegistry<'site.saveSiteCate', { key: timer.site.SiteKey; cateId: number | undefined }>
        & _MakeRegistry<'site.batchSaveSiteCate', { cateId: number | undefined; keys: timer.site.SiteKey[] }>
        & _MakeRegistry<'site.removeIconUrl' | 'site.removeAlias', timer.site.SiteKey>
        & _MakeRegistry<'site.saveSiteRunState', { key: timer.site.SiteKey; run: boolean }>
        & _MakeRegistry<'site.batchGetSites', timer.site.SiteKey[], timer.site.SiteInfo[]>
        & _MakeRegistry<'site.batchSaveAliasNoRewrite', Array<{ key: timer.site.SiteKey; alias: string }>>
        & _MakeRegistry<'site.saveAlias', { key: timer.site.SiteKey; alias: string; noRewrite?: boolean }>
        // limit / whitelist / backup (runtime; CS→SW etc.)
        & _MakeRegistry<'openLimitPage', string>
        & _MakeRegistry<'limit.select', timer.limit.Query | undefined, timer.limit.Item[]>
        & _MakeRegistry<'limit.remove', timer.limit.Item | timer.limit.Item[]>
        & _MakeRegistry<'limit.updateEnabled', timer.limit.Item[]>
        & _MakeRegistry<'limit.updateDelay' | 'limit.updateLocked', timer.limit.Item>
        & _MakeRegistry<'limit.update', timer.limit.Rule[]>
        & _MakeRegistry<'limit.create', Partial<timer.limit.Rule>, number>
        & _MakeRegistry<'whitelist.listAll', undefined, string[]>
        & _MakeRegistry<'whitelist.add' | 'whitelist.remove', string>
        & _MakeRegistry<'backup.syncData', undefined, { success: boolean; errorMsg?: string; data?: number }>
        & _MakeRegistry<'backup.checkAuth', undefined, { errorMsg?: string }>
        & _MakeRegistry<'backup.clear', string, { success: boolean; errorMsg?: string }>
        & _MakeRegistry<'backup.query', timer.backup.RemoteQuery, timer.backup.Row[]>
        & _MakeRegistry<'backup.getLastBackUp', timer.backup.Type, { ts: number; msg?: string } | undefined>
        & _MakeRegistry<'backup.listClients', undefined, { success: boolean; errorMsg?: string; data?: timer.backup.Client[] }>
        // period / import / immigration / memory
        & _MakeRegistry<'period.merge', timer.period.MergeRequest, timer.period.Result[]>
        & _MakeRegistry<'period.listBetween', { periodRange: timer.period.KeyRange }, timer.period.Result[]>
        & _MakeRegistry<'import.fillExist', timer.imported.Row[]>
        & _MakeRegistry<'import.processImportedData', { data: timer.imported.Data; resolution: timer.imported.ConflictResolution }>
        & _MakeRegistry<'immigration.importData', any>
        & _MakeRegistry<'immigration.exportData', undefined, timer.backup.ExportData>
        & _MakeRegistry<'memory.getUsedStorage', undefined, timer.common.StorageUsage>

    type ReqCode = keyof _HandlerRegistry
    /** Codes handled only via tabs.sendMessage — must not use sendMsg2Runtime. */
    type RuntimeReqCode = Exclude<ReqCode, tab.TabCode>

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
