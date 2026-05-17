type _TransmitValue =
    | undefined | string | number | boolean | void
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
        // Track event
        & _MakeRegistry<'track.time' | 'track.runTime', core.Event>
        // Content script events
        & _MakeRegistry<'cs.injected'>
        & _MakeRegistry<'cs.idleChanged', boolean>
        // Content script API
        & _MakeRegistry<'cs.getAudible', undefined, boolean>
        // Statistics
        & _MakeRegistry<'stat.today', string, core.Result | undefined>
        & _MakeRegistry<'stat.sites', stat.SiteQuery | undefined, stat.SiteRow[]>
        & _MakeRegistry<'stat.sitePage', stat.SitePageQuery | undefined, common.PageResult<stat.SiteRow>>
        & _MakeRegistry<'stat.deleteSite', stat.SiteDeleteQuery>
        & _MakeRegistry<'stat.countSite', stat.SiteQuery | undefined, number>
        & _MakeRegistry<'stat.cates', stat.CateQuery | undefined, stat.CateRow[]>
        & _MakeRegistry<'stat.catePage', stat.CatePageQuery | undefined, common.PageResult<stat.CateRow>>
        & _MakeRegistry<'stat.groups', stat.GroupQuery | undefined, stat.GroupRow[]>
        & _MakeRegistry<'stat.groupPage', stat.GroupPageQuery | undefined, common.PageResult<stat.GroupRow>>
        & _MakeRegistry<'stat.countGroup', stat.GroupQuery | undefined, number>
        & _MakeRegistry<'stat.batchDelete', stat.StatKey[]>
        // Items
        & _MakeRegistry<'item.batch', core.RowKey[], core.Row[]>
        // Category
        & _MakeRegistry<'cate.all', undefined, site.Cate[]>
        & _MakeRegistry<'cate.add', Omit<site.Cate, 'id'>, site.Cate>
        & _MakeRegistry<'cate.change', site.Cate>
        & _MakeRegistry<'cate.delete', number>
        // Option
        & _MakeRegistry<'option.get', undefined, option.DefaultOption>
        & _MakeRegistry<'option.set', Partial<option.AllOption>>
        & _MakeRegistry<'option.changeStorage', option.StorageType>
        & _MakeRegistry<'option.testNotification', undefined, string | undefined>
        & _MakeRegistry<'option.weekStartDay', undefined, number>
        & _MakeRegistry<'option.weekStartTime', number, number>
        // Meta
        & _MakeRegistry<'meta.installTs', undefined, number>
        & _MakeRegistry<'meta.usedStorage', undefined, common.StorageUsage>
        & _MakeRegistry<'meta.check2fa', string, boolean>
        & _MakeRegistry<'meta.prepare2fa', undefined, string>
        // Site
        & _MakeRegistry<'site.runEnabled', string, boolean>
        & _MakeRegistry<'site.list', site.Query | undefined, site.SiteInfo[]>
        & _MakeRegistry<'site.page', site.PageQuery | undefined, common.PageResult<site.SiteInfo>>
        & _MakeRegistry<'site.add', site.SiteInfo, string | undefined>
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
        & _MakeRegistry<'limit.delete', number[]>
        & _MakeRegistry<'limit.update', limit.Rule[]>
        & _MakeRegistry<'limit.add', Omit<limit.Rule, 'id'>, number>
        & _MakeRegistry<'limit.hitVisit', limit.Item, boolean>
        & _MakeRegistry<'limit.delay', string>
        & _MakeRegistry<'limit.summary', undefined, limit.Summary | undefined>
        // Merge
        & _MakeRegistry<'merge.all', undefined, merge.Rule[]>
        & _MakeRegistry<'merge.delete', string>
        & _MakeRegistry<'merge.add', merge.Rule>
        // Whitelist
        & _MakeRegistry<'whitelist.all', undefined, string[]>
        & _MakeRegistry<'whitelist.add' | 'whitelist.delete', string>
        & _MakeRegistry<'whitelist.contain', { host: string; url: string }, boolean>
        // Backup
        & _MakeRegistry<'backup.sync' | 'backup.checkAuth', undefined, string | undefined>
        & _MakeRegistry<'backup.clear', string, string | undefined>
        & _MakeRegistry<'backup.query', backup.RemoteQuery, backup.Row[]>
        & _MakeRegistry<'backup.lastTs', backup.Type, number | undefined>
        & _MakeRegistry<'backup.clients', undefined, (backup.Client & { current: boolean })[]>
        // Period
        & _MakeRegistry<'period.list', period.Query, period.Row[]>
        // Timeline
        & _MakeRegistry<'timeline.list', timeline.Query, timeline.Activity[]>
        & _MakeRegistry<'timeline.tick', timeline.Event>
        & _MakeRegistry<'backup.preview', backup.RemoteQuery, imported.Row[]>
        & _MakeRegistry<'immigration.importOther', imported.ProcessQuery>
        & _MakeRegistry<'immigration.import', any>
        & _MakeRegistry<'immigration.export', undefined, backup.ExportData>

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
        & _MakeRegistry<'limitTimeMeet', limit.Item[]>
        & _MakeRegistry<'limitChanged'>
        & _MakeRegistry<'limitReminder', limit.ReminderInfo>
        & _MakeRegistry<'askVisitHit', number, boolean>

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