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
        & _MakeRegistry<'cs.trackTime' | 'cs.trackRunTime', core.Event>
        & _MakeRegistry<'cs.onInjected' | 'cs.openAnalysis'>
        & _MakeRegistry<'cs.idleChange', boolean>
        & _MakeRegistry<'cs.getAudible', undefined, boolean>
        // Statistics
        & _MakeRegistry<'stat.today', string, core.Result | undefined>
        & _MakeRegistry<'stat.listSite', stat.SiteQuery | undefined, stat.SiteRow[]>
        & _MakeRegistry<'stat.getSitePage', stat.SitePageQuery | undefined, common.PageResult<timer.stat.SiteRow>>
        & _MakeRegistry<'stat.deleteSite', stat.SiteDeleteQuery>
        & _MakeRegistry<'stat.countSite', stat.SiteQuery | undefined, number>
        & _MakeRegistry<'stat.selectCate', stat.CateQuery | undefined, stat.CateRow[]>
        & _MakeRegistry<'stat.selectCatePage', stat.CatePageQuery | undefined, common.PageResult<timer.stat.CateRow>>
        & _MakeRegistry<'stat.countGroup', stat.GroupQuery | undefined, number>
        & _MakeRegistry<'stat.selectGroup', stat.GroupQuery | undefined, stat.GroupRow[]>
        & _MakeRegistry<'stat.selectGroupPage', stat.GroupPageQuery | undefined, common.PageResult<timer.stat.GroupRow>>
        & _MakeRegistry<'stat.mergeDate', stat.SiteRow[], stat.SiteRow[]>
        & _MakeRegistry<'stat.batchDelete', stat.Row[]>
        // Category
        & _MakeRegistry<'cate.all', undefined, site.Cate[]>
        & _MakeRegistry<'cate.add', string, site.Cate>
        & _MakeRegistry<'cate.saveName', { id: number; name: string }>
        & _MakeRegistry<'cate.remove', number>
        // Option
        & _MakeRegistry<'option.get', undefined, option.AllOption>
        & _MakeRegistry<'option.set', Partial<timer.option.AllOption>>
        & _MakeRegistry<'option.setDarkMode', Pick<timer.option.AppearanceOption, 'darkMode' | 'darkModeTimeStart' | 'darkModeTimeEnd'>>
        & _MakeRegistry<'option.setLocale', option.LocaleOption>
        & _MakeRegistry<'option.setBackupOption', Partial<timer.option.BackupOption>>
        & _MakeRegistry<'option.migrateStorage', option.StorageType>
        & _MakeRegistry<'option.testNotification', undefined, common.Result<void>>
        & _MakeRegistry<'option.getWeekBounds', number, { start: number; end: number }>
        & _MakeRegistry<'option.getWeekStartDay', undefined, number>
        // Meta
        & _MakeRegistry<'meta.saveFlag', ExtensionMetaFlag>
        & _MakeRegistry<'meta.getCid', undefined, string | undefined>
        & _MakeRegistry<'meta.increaseApp', string>
        & _MakeRegistry<'meta.increasePopup'>
        & _MakeRegistry<'meta.recommendRate', undefined, boolean>
        // Site
        & _MakeRegistry<'site.runEnabled', string, boolean>
        & _MakeRegistry<'site.all', site.Query | undefined, site.SiteInfo[]>
        & _MakeRegistry<'site.page', site.PageQuery | undefined, common.PageResult<timer.site.SiteInfo>>
        & _MakeRegistry<'site.add', site.SiteInfo, common.Result<void>>
        & _MakeRegistry<'site.delete', site.SiteKey[]>
        & _MakeRegistry<'site.changeCate', site.ChangeCateParam>
        & _MakeRegistry<'site.deleteIcon', site.SiteKey>
        & _MakeRegistry<'site.changeAlias', site.ChangeAliasParam>
        & _MakeRegistry<'site.fillAlias', site.SiteKey[]>
        & _MakeRegistry<'site.initialAlias', string, string | undefined>
        & _MakeRegistry<'site.changeRun', { key: site.SiteKey; enabled: boolean }>
        & _MakeRegistry<'site.search', string | undefined, site.SiteInfo[]>
        // Time Limit
        & _MakeRegistry<'limit.list', limit.Query | undefined, limit.Item[]>
        & _MakeRegistry<'limit.batchRemove', limit.Rule[]>
        & _MakeRegistry<'limit.batchUpdateEnabled', limit.Rule[]>
        & _MakeRegistry<'limit.updateDelay' | 'limit.updateLocked' | 'limit.update', limit.Rule>
        & _MakeRegistry<'limit.create', MakeOptional<timer.limit.Rule, 'id'>, number>
        & _MakeRegistry<'limit.listLimited' | 'limit.listEffective', string, limit.Item[]>
        & _MakeRegistry<'limit.hitVisit', limit.Item, boolean>
        & _MakeRegistry<'limit.delay', string>
        & _MakeRegistry<'limit.openRule', string>
        // Merge
        & _MakeRegistry<'merge.all', undefined, merge.Rule[]>
        & _MakeRegistry<'merge.remove', string>
        & _MakeRegistry<'merge.add', merge.Rule>
        // Whitelist
        & _MakeRegistry<'whitelist.all', undefined, string[]>
        & _MakeRegistry<'whitelist.add' | 'whitelist.remove', string>
        & _MakeRegistry<'whitelist.contain', { host: string; url: string }, boolean>
        // Backup
        & _MakeRegistry<'backup.syncData', undefined, { success: boolean; errorMsg?: string; data?: number }>
        & _MakeRegistry<'backup.checkAuth', undefined, string | undefined>
        & _MakeRegistry<'backup.clear', string, { success: boolean; errorMsg?: string }>
        & _MakeRegistry<'backup.query', backup.RemoteQuery, backup.Row[]>
        & _MakeRegistry<'backup.getLastBackUp', backup.Type, { ts: number; msg?: string } | undefined>
        & _MakeRegistry<'backup.listClients', undefined, { success: boolean; errorMsg?: string; data?: backup.Client[] }>
        // Period
        & _MakeRegistry<'period.select', period.Query, period.Row[]>
        // Timeline
        & _MakeRegistry<'timeline.list', timeline.Query, timeline.Activity[]>
        & _MakeRegistry<'timeline.tick', timeline.Event>
        & _MakeRegistry<'import.preview', imported.PreviewQuery, imported.Row[]>
        & _MakeRegistry<'import.processImportedData', imported.ProcessQuery>
        & _MakeRegistry<'immigration.importData', any>
        & _MakeRegistry<'immigration.exportData', undefined, backup.ExportData>
        & _MakeRegistry<'memory.getUsedStorage', undefined, common.StorageUsage>

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
        & _MakeRegistry<'limitTimeMeet' | 'limitWaking' | 'limitChanged', limit.Item[]>
        & _MakeRegistry<'limitReminder', limit.ReminderInfo>
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