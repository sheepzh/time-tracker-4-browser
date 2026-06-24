declare namespace tt4b {
    type RequiredLocale = 'en'
    type OptionalLocale =
        | 'zh_CN'
        | 'ja'
        // @since 0.9.0
        | 'zh_TW'
        // @since 1.8.2
        | 'pt_PT'
        // @since 2.1.0
        | 'uk'
        // @since 2.1.4
        | 'es'
        // @since 2.2.7
        | 'de'
        // @since 2.3.6
        | 'fr'
        // @since 2.4.6
        | 'ru'
        // @since 2.5.0
        | 'ar'
        // @since 3.7.3
        | 'tr'
        // @since 3.7.3
        | 'pl'
        // @since 4.1.2
        | 'it'

    /**
     * @since 0.8.0
     */
    type Locale = RequiredLocale | OptionalLocale

    /**
     * Translating locales
     *
     * @since 1.4.0
     */
    type TranslatingLocale =
        | 'ko'
        | 'pl'
        | 'it'
        | 'sv'
        | 'fi'
        | 'da'
        | 'hr'
        | 'id'
        | 'cs'
        | 'ro'
        | 'nl'
        | 'vi'
        | 'sk'
        | 'mn'
        | 'hi'
        | 'hu'
        | 'nb'

    type ExtensionMeta = {
        installTime?: number
        /**
         * The id of this client
         *
         * @since 1.2.0
         */
        cid?: string
        backup?: {
            [key in backup.Type]?: {
                ts: number
                msg?: string
            }
        }
        notification?: {
            [key in notification.Method]?: {
                ts: number
                endDate: string
                msg?: string
            }
        }
        /**
         * Two-factor auth
         */
        twoFa?: TwoFactorAuth
        popup?: ui.PopupMenu
    }

    type TwoFactorAuth = {
        secret: string
        iv: string
        salt: string
    }

    namespace ui {
        /**
         * @since 1.1.7
         */
        type TimeFormat =
            | "default"
            | "second"
            | "minute"
            | "hour"

        type PopupMenu = 'percentage' | 'ranking' | 'limit' | 'focus'
    }

    namespace common {
        type Result<T> = {
            success: true
            data: T
        } | {
            success: false
            errorMsg: string
        }

        type PageQuery = {
            num?: number
            size?: number
        }

        type PageResult<T> = {
            list: T[]
            total: number
        }

        type SortDirection = 'ASC' | 'DESC'
        type SortBy<T extends string> = {
            sortKey?: T
            sortDirection?: SortDirection
        }

        /**
         * chrome.storage.local usage (mq memory.getUsedStorage).
         */
        type StorageUsage = {
            used: number
            total: number
        }
    }

    namespace notification {
        type Method = 'browser' | 'callback'
        type Cycle = 'none' | 'daily' | 'weekly'
    }

    namespace core {
        type Event = {
            start: number
            end: number
            ignoreTabCheck: boolean
            /**
             * Used for run time tracking
             */
            host?: string
        }

        /**
         * The dimension to statistics
         */
        type Dimension =
            // Focus time
            | 'focus'
            // Visit count
            | 'time'
            // Run time
            | 'run'

        /**
         * The stat result of host
         *
         * @since 0.0.1
         */
        type Result = MakeOptional<{ [item in Dimension]: number }, 'run'>

        /**
         * The unique key of each data row
         */
        type RowKey = {
            host: string
            date: string
        }

        type Row = RowKey & Result
    }

    namespace site {
        type SiteKey = {
            host: string
            type: Type
        }
        type SiteInfo = SiteKey & {
            alias?: string
            iconUrl?: string
            /**
             * Category ID
             *
             * @since 3.0.0
             */
            cate?: number
            /**
             * Whether to count the running time
             *
             * @since 3.2.0
             */
            run?: boolean
        }
        type Type = 'normal' | 'merged' | 'virtual'
        /**
         * Site tag
         *
         * @since 3.0.0
         */
        type Cate = {
            id: number
            name: string
        }

        type Query = {
            fuzzyQuery?: string
            cateIds?: Arrayable<number>
            types?: Arrayable<Type>
        }

        type PageQuery = Query & common.PageQuery

        type ChangeCateParam = {
            // Undefined means uncategorized
            cateId: number | undefined
            keys: SiteKey[]
        }

        type ModifyParam = MakeOptionalUndefined<Pick<tt4b.site.SiteInfo, 'host' | 'type' | 'alias' | 'iconUrl'>>
    }

    namespace merge {
        type Rule = {
            /**
             * Origin host, can be regular expression with star signs
             */
            origin: string
            /**
             * The merge result
             *
             * + Empty string means equals to the origin host
             * + Number means the count of kept dots, must be natural number (int & >=0)
             */
            merged: string | number
        }
    }

    namespace limit {
        /**
         * Restricted periods
         * [0, 1] means from 00:00 to 00:01
         * [0, 120] means from 00:00 to 02:00
         * @since 2.0.0
         */
        type Period = Vector<2>
        /**
         * Limit rule in runtime
         *
         * @since 0.8.4
         */
        type Item = Rule & {
            /**
             * Waste today, milliseconds
             */
            waste: number
            /**
             * Visit count today
             *
             * @since 3.1.0
             */
            visit: number
            /**
             * Number of delays today
             */
            delayCount: number
            /**
             * Waste this week, milliseconds
             */
            weeklyWaste: number
            /**
             * Visit count this week
             *
             * @since 3.1.0
             */
            weeklyVisit: number
            /**
             * Delay count of this week
             */
            weeklyDelayCount: number
        }
        type Rule = {
            /**
             * Id
             */
            id: number
            /**
             * Name
             */
            name: string
            /**
             * Condition, can be regular expression with star signs
             */
            cond: string[]
            /**
             * Time limit per day, seconds
             */
            time?: number
            /**
             * Visit count per day
             *
             * @since 3.1.0
             */
            count?: number
            /**
             * Time limit per week, seconds
             *
             * @since 2.4.1
             */
            weekly?: number
            /**
             * Visit count per week
             *
             * @since 3.1.0
             */
            weeklyCount?: number
            /**
             * Time limit per visit, seconds
             *
             * @since 2.0.0
             */
            visitTime?: number
            enabled: boolean
            /**
             * Locked
             *
             * @since 3.4.0
             */
            locked: boolean
            /**
             * @since 2.3.4
             */
            weekdays?: number[]
            /**
             * Allow to delay 5 minutes if time over
             */
            allowDelay: boolean
            periods?: Period[]
        }
        /**
         * @since 1.9.0
         */
        type RestrictionLevel =
            // No additional action required to lock
            | 'nothing'
            // Password required to lock or modify restricted rule
            | 'password'
            // Verification code input required to lock or modify restricted rule
            | 'verification'
            // Not allowed to unlock manually
            | 'strict'
            // Unlock with 2FA code
            | '2fa'
        /**
         * @since 1.9.0
         */
        type VerificationDifficulty =
            // Easy
            | 'easy'
            // Need some operations
            | 'hard'
            // Disgusting
            | 'disgusting'

        type ReasonType =
            | "DAILY"
            | "WEEKLY"
            | "VISIT"
            | "PERIOD"

        /**
         * @since 3.1.0
         */
        type ReminderInfo = {
            items: Item[]
            // Minutes
            duration: number
        }

        type Query = {
            id?: number
            url?: string
            // Only enabled rules
            enabled?: boolean
            // Only effective rules (should be enabled and meet effective conditions)
            effective?: boolean
            // Only effective and limited rules
            limited?: boolean
        }

        type Summary = {
            url: string
            site: site.SiteInfo
            items: Item[]
        }
    }

    namespace period {
        type Key = {
            year: number
            month: number
            date: number
            /**
             * 0~95
             * ps. 95 = 60 / 15 * 24 - 1
             */
            order: number
        }
        type KeyRange = [Key, Key]

        type Result = Key & {
            /**
             * 1~900000
             * ps. 900000 = 15min * 60s/min * 1000ms/s
             */
            milliseconds: number
        }

        type Row = {
            /**
             * {yyyy}{mm}{dd}
             */
            date: string
            /** Unix timestamp (ms) of row start */
            startTime: number
            /** Unix timestamp (ms) of row end */
            endTime: number
            /**
             * 1 - 60000
             * ps. 60000 = 60s * 1000ms/s
             */
            milliseconds: number
        }

        type Query = {
            range?: KeyRange
            size?: number
        }
    }

    namespace timeline {
        type Event = {
            start: number
            end: number
            url: string
        }

        type Tick = {
            start: number
            duration: number
            host: string
        }

        type MergeMethod = 'cate' | 'domain' | 'none'

        type Activity = {
            start: number
            duration: number
            seriesKey: string
            seriesName: string | undefined
        }

        type Query = {
            host?: string
            start?: number
            merge: MergeMethod
        }
    }

    /**
     * @since 1.2.0
     */
    namespace backup {
        type Client = {
            id: string
            name: string
            minDate?: string
            maxDate?: string
        }

        type LoginInfo = {
            acc?: string
            psw?: string
        }

        type Auth = {
            token?: string
            login?: LoginInfo
        }

        interface CoordinatorContext<Cache> {
            cid: string
            auth?: Auth
            login?: LoginInfo
            ext?: TypeExt
            cache: Cache
            handleCacheChanged: () => Promise<void>
        }

        /**
         * backup.Coordinator of data synchronizer
         */
        interface Coordinator<Cache> {
            /**
             * Register for client
             */
            updateClients(context: CoordinatorContext<Cache>, clients: Client[]): Promise<void>
            /**
             * List all clients
             */
            listAllClients(context: CoordinatorContext<Cache>): Promise<Client[]>
            /**
             * Download fragmented data from cloud
             *
             * @param targetCid The client id, default value is the local one in context
             */
            download(context: CoordinatorContext<Cache>, start: string, end: string, targetCid?: string): Promise<core.Row[]>
            /**
             * Upload fragmented data to cloud
             * @param rows
             */
            upload(context: CoordinatorContext<Cache>, rows: core.Row[]): Promise<void>
            /**
             * Test auth
             *
             * @returns errorMsg or null/undefined
             */
            testAuth(auth: Auth, ext: TypeExt): Promise<string | undefined>
            /**
             * Clear data
             */
            clear(context: CoordinatorContext<Cache>, client: Client): Promise<void>
        }

        type Type =
            | 'none'
            | 'gist'
            // Sync into Obsidian via its plugin Local REST API
            // @since 1.9.4
            | 'obsidian_local_rest_api'
            // @since 2.4.5
            | 'web_dav'

        type AuthType =
            | 'token'
            | 'password'

        type TypeExt = {
            /**
             * The vault of obsidian
             *
             * @since 2.4.4
             */
            bucket?: string
            endpoint?: string
            dirPath?: string
        }

        type MetaCache = Partial<Record<Type, unknown>>

        type RowExtend = {
            /**
             * The id of client where the remote data is stored
             */
            cid?: string
            /**
             * The name of client where the remote data is stored
             */
            cname?: string
        }

        type RemoteQuery = {
            start: string
            end: string
            specCid?: string
            excludeLocal?: boolean
        }

        type Row = core.Row & RowExtend

        /**
         * The data format for export and import
         */
        type ExportMeta = {
            version: string
            ts: number
        }

        type ExportData = {
            __meta__: ExportMeta
            __stat__?: core.Row[]
            __limit__?: limit.Rule[]
            __merge__?: merge.Rule[]
            __whitelist__?: string[]
            __cate__?: site.Cate[]
        }
    }

    /**
     * @since 1.9.2
     */
    namespace imported {
        type ConflictResolution = 'overwrite' | 'accumulate'

        type Row = Required<core.RowKey> & core.Result & {
            exist?: core.Result
        }

        type Data = {
            // Whether there is data for this dimension
            [dimension in core.Dimension]?: boolean
        } & {
            rows: Row[]
        }

        type ProcessQuery = {
            data: Data
            resolution: ConflictResolution
        }
    }

    namespace stat {
        type SiteTarget = {
            siteKey: site.SiteKey
        }
        type CateTarget = {
            cateKey: number
        }
        type GroupTarget = {
            groupKey: number
        }
        type TargetKey = SiteTarget | CateTarget | GroupTarget
        type DateKey = { date: string }
        type StatKey = TargetKey & DateKey

        type DateMergeExtend = {
            /**
             * The merged dates
             *
             * @since 2.4.7
             */
            mergedDates?: string[]
        }

        type RemoteExtend = {
            /**
             * The composition of data when querying remote
             */
            composition?: RemoteComposition
        }

        /** StatCondition.date fields only (mq / stat-database queries). */
        type _BaseQuery = {
            date?: string | [string?, string?]
            mergeDate?: boolean
        }

        type SiteQuery =
            & _BaseQuery
            & {
                focusRange?: Vector<2>
                timeRange?: [number, number?]
                virtual?: boolean
            }
            & common.SortBy<'date' | 'host' | core.Dimension>
            & {
                query?: string
                host?: string | string[]
                mergeHost?: boolean
                inclusiveRemote?: boolean
                cateIds?: number[]
                ignoreSite?: boolean
            }

        type SiteDeleteQuery = ({
            host: string
        } | {
            groupId: number
        }) & {
            date?: [start?: string, end?: string] | string
        }

        type SitePageQuery = SiteQuery & common.PageQuery

        type SiteRowFlat = SiteTarget &
            DateKey &
            core.Result &
            backup.RowExtend &
            DateMergeExtend &
            RemoteExtend & {
                /**
                 * Icon url
                 */
                iconUrl?: string
                /**
                 * The alias name of this Site, always is the title of its homepage by detected
                 */
                alias?: string
                /**
                 * @since 3.0.0
                 */
                cateId?: number
            }

        type SiteMergeExtend = {
            /**
             * The merged domains
             * Can't be empty if merged
             *
             * @since 0.1.5
             */
            mergedRows?: SiteRowFlat[]
        }

        type SiteRow = SiteRowFlat & SiteMergeExtend

        type CateQuery = _BaseQuery
            & common.SortBy<'date' | 'focus' | 'time'>
            & {
                query?: string
                inclusiveRemote?: boolean
                cateIds?: number[]
            }

        type CatePageQuery = CateQuery & common.PageQuery

        type CateRowFlat = CateTarget &
            DateKey &
            core.Result &
            backup.RowExtend &
            DateMergeExtend &
            RemoteExtend & {
                cateName: string | undefined
            }

        type CateMergeExtend = {
            mergedRows?: SiteRowFlat[]
        }

        type CateRow = CateRowFlat & CateMergeExtend

        type GroupRowFlat = GroupTarget &
            DateKey &
            DateMergeExtend &
            core.Result & {
                color: `${chrome.tabGroups.Color}` | undefined
                title: string | undefined
            }

        type GroupQuery = _BaseQuery
            & {
                focusRange?: Vector<2>
                timeRange?: [number, number?]
            }
            & common.SortBy<'date' | 'title' | 'focus' | 'time'>
            & {
                query?: string
                groupIds?: number[]
            }

        type GroupPageQuery = GroupQuery & common.PageQuery

        type GroupMergeExtend = {
            mergedRows?: GroupRowFlat[]
        }

        type GroupRow = GroupRowFlat & GroupMergeExtend

        /**
         * Row of each statistics result
         */
        type Row = SiteRow | CateRow | GroupRow

        type RemoteCompositionVal =
            // Means local data
            number | {
                /**
                 * Client's id
                 */
                cid: string
                /**
                 * Client's name
                 */
                cname?: string
                value: number
            }

        /**
         * @since 1.4.7
         */
        type RemoteComposition = {
            [item in core.Dimension]: RemoteCompositionVal[]
        }

        /**
         * @since 3.0.0
         */
        type MergeMethod = 'cate' | 'date' | 'domain' | 'group'
    }

    /**
     * The options
     *
     * @since 0.3.0
     */
    namespace option {
        /**
         * @since 1.2.5
         */
        type WeekStartOption =
            | 'default'
            | number  // Weekday, From 1 to 7

        type DarkMode =
            // Follow the OS, @since 1.3.3
            | "default"
            // Always on
            | "on"
            // Always off
            | "off"
            // Timed on
            | "timed"

        type AppearanceOption = {
            /**
             * Whether to display the whitelist button in the context menu
             *
             * @since 0.3.2
             */
            displayWhitelistMenu: boolean
            /**
             * Whether to display the badge text of focus time
             *
             * @since 0.3.3
             */
            displayBadgeText: boolean
            /**
             * The background color of badge text
             *
             * @since 2.3.0
             */
            badgeBgColor?: string
            /**
             * The language of this extension
             *
             * @since 0.8.0
             */
            locale: LocaleOption
            /**
             * Whether to print the info in the console
             *
             * @since 0.8.6
             */
            printInConsole: boolean
            /**
             * The state of dark mode
             *
             * @since 1.1.0
             */
            darkMode: DarkMode
            /**
             * The range of seconds to turn on dark mode. Required if {@param darkMode} is 'timed'
             *
             * @since 1.1.0
             */
            darkModeTimeStart?: number
            darkModeTimeEnd?: number
            /**
             * The animation of charts
             *
             * @since 3.2.2
             */
            chartAnimationDuration: number
        }

        type AppearanceRequired = MakeRequired<AppearanceOption, 'darkModeTimeStart' | 'darkModeTimeEnd'>

        type TrackingOption = {
            /**
             * Whether to pause tracking if no activity detected
             *
             * @since 2.5.4
             */
            autoPauseTracking: boolean
            /**
             * Check interval of auto pausing, seconds
             *
             * @since 2.5.4
             */
            autoPauseInterval: number
            /**
             * Whether to count the local files
             * @since 0.7.0
             */
            countLocalFiles: boolean
            /**
             * Whether to count the tile of tab group
             */
            countTabGroup: boolean
            /**
             * The start of one week
             * @since 2.4.1
             */
            weekStart?: WeekStartOption
            /**
             * Where to store the tracking data
             *
             * @since 4.0.0
             */
            storage: StorageType
        }

        type TrackingRequired = MakeRequired<TrackingOption, 'weekStart'>

        type LimitOption = {
            /**
             * Delay duration, minutes
             */
            limitDelayDuration: number
            /**
             * Motto displayed when restricted
             */
            limitPrompt?: string
            /**
             * restriction level
             */
            limitLevel: limit.RestrictionLevel
            /**
             * The password to unlock
             */
            limitPassword?: string
            /**
             * The difficulty of verification
             */
            limitVerifyDifficulty?: limit.VerificationDifficulty
            /**
             *  Whether to reminder before time will meet
             *
             * @since 3.1.0
             */
            limitReminder: boolean
            /**
             * Minutes
             *
             * @since 3.1.0
             */
            limitReminderDuration?: number
        }

        type LimitRequired = MakeRequired<LimitOption, 'limitPassword' | 'limitVerifyDifficulty' | 'limitReminderDuration'>

        /**
         * The options of backup
         *
         * @since 1.2.0
         */
        type BackupOption = {
            /**
             * The type 2 backup
             */
            backupType: backup.Type
            /**
             * The auth of types, maybe ak/sk or static token
             */
            backupAuths: { [type in backup.Type]?: string }
            /**
             * Login info of types
             */
            backupLogin: { [type in backup.Type]?: backup.LoginInfo }
            /**
             * The extended information of types, including url, file path, and so on
             */
            backupExts?: {
                [type in backup.Type]?: backup.TypeExt
            }
            /**
             * The name of this client
             */
            clientName: string
            /**
             * Whether to auto-backup data
             */
            autoBackUp: boolean
            /**
             * Interval to auto-backup data, minutes
             */
            autoBackUpInterval: number
        }

        type AccessibilityOption = {
            /**
             * Show decals for charts
             */
            chartDecal: boolean
        }

        type NotificationOption = {
            /**
             * Notification cycle: none, daily, or weekly
             */
            notificationCycle: notification.Cycle
            /**
             * Offset time in minutes relative to the start of the cycle
             */
            notificationOffset: number
            /**
             * Notification method: browser or callback
             */
            notificationMethod: notification.Method
            /**
             * HTTP callback endpoint URL
             */
            notificationEndpoint?: string
            /**
             * Auth token for HTTP callback (optional)
             */
            notificationAuthToken?: string
        }

        export type DefaultOption =
            & AppearanceRequired & TrackingRequired & LimitRequired
            & BackupOption & AccessibilityOption & NotificationOption

        type AllOption =
            & AppearanceOption
            & TrackingOption
            & LimitOption
            & AccessibilityOption
            & BackupOption
            & NotificationOption

        /**
         * @since 0.8.0
         */
        type LocaleOption = Locale | "default"

        /**
         * @since 4.0.0
         */
        type StorageType = 'classic' | 'indexed_db'
    }

    namespace mq {
        type _TransmitValue =
            | undefined | string | number | boolean | void
            | { readonly [key: string]: _TransmitValue }
            | readonly _TransmitValue[]

        type _HandlerIO<Input extends _TransmitValue = undefined, Output extends _TransmitValue = undefined> = [Input, Output]
        type _MakeRegistry<
            Codes extends string,
            Param extends _TransmitValue = undefined,
            Result extends _TransmitValue = undefined,
        > = Record<Codes, _HandlerIO<Param, Result>>

        type _MqReqData<R, K extends keyof R> = R[K] extends [infer In, unknown] ? In : never
        type _MqResData<R, K extends keyof R> = R[K] extends [unknown, infer Out] ? Out : never
        type _MqRequest<R, K extends keyof R = keyof R> = { code: K; data: _MqReqData<R, K> }
        type _MqSuccess<R, K extends keyof R> =
            _MqResData<R, K> extends undefined ? { code: "success"; data?: undefined } : {
                code: "success"
                data: _MqResData<R, K>
            }
        type _MqResponse<R, K extends keyof R = keyof R> =
            | { code: "fail"; msg: string }
            | { code: "ignore" }
            | (K extends keyof R ? _MqSuccess<R, K> : never)
        type _MqHandler<R, C extends keyof R> = _MqResData<R, C> extends undefined
            ? (data: _MqReqData<R, C>, sender: chrome.runtime.MessageSender) => Awaitable<void | undefined>
            : (data: _MqReqData<R, C>, sender: chrome.runtime.MessageSender) => Awaitable<_MqResData<R, C>>

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
            & _MakeRegistry<'cate.add', string, site.Cate>
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
            & _MakeRegistry<'meta.popup', ui.PopupMenu | undefined>
            // Site
            & _MakeRegistry<'site.runEnabled', string, boolean>
            & _MakeRegistry<'site.list', site.Query | undefined, site.SiteInfo[]>
            & _MakeRegistry<'site.page', site.PageQuery | undefined, common.PageResult<site.SiteInfo>>
            & _MakeRegistry<'site.add', site.SiteInfo, string | undefined>
            & _MakeRegistry<'site.modify', site.ModifyParam>
            & _MakeRegistry<'site.delete', site.SiteKey[]>
            & _MakeRegistry<'site.changeCate', site.ChangeCateParam>
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
            // Focus
            & _MakeRegistry<'focus.allPresets', undefined, focus.Preset[]>
            & _MakeRegistry<'focus.getPreset', number, focus.Preset | undefined>
            & _MakeRegistry<'focus.addPreset', Omit<focus.Preset, 'id'>, number>
            & _MakeRegistry<'focus.savePreset', focus.Preset>
            & _MakeRegistry<'focus.deletePreset', number>
            & _MakeRegistry<'focus.action', focus.ActionRequest>
            & _MakeRegistry<'focus.current', undefined, focus.Session | undefined>
            // Merge
            & _MakeRegistry<'merge.all', undefined, merge.Rule[]>
            & _MakeRegistry<'merge.delete', string>
            & _MakeRegistry<'merge.add', merge.Rule>
            // Whitelist
            & _MakeRegistry<'whitelist.all', undefined, string[]>
            & _MakeRegistry<'whitelist.add' | 'whitelist.delete', string>
            & _MakeRegistry<'whitelist.save', string[]>
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
    namespace tab {
        type _HandlerRegistry =
            & mq._MakeRegistry<'siteRunChange'>
            & mq._MakeRegistry<'syncAudible', boolean>
            & mq._MakeRegistry<'limitTimeMeet', limit.Item[]>
            & mq._MakeRegistry<'limitChanged'>
            & mq._MakeRegistry<'limitReminder', limit.ReminderInfo>
            & mq._MakeRegistry<'askVisitHit', number, boolean>
            & mq._MakeRegistry<'focusChanged', focus.Session | undefined>

        type ReqCode = keyof _HandlerRegistry

        type ReqData<T extends ReqCode> = mq._MqReqData<_HandlerRegistry, T>

        type ResData<T extends ReqCode> = mq._MqResData<_HandlerRegistry, T>

        type Request<T extends ReqCode = ReqCode> = mq._MqRequest<_HandlerRegistry, T>

        type Response<T extends ReqCode = ReqCode> = mq._MqResponse<_HandlerRegistry, T>

        /**
         * @since 0.8.4
         */
        type Callback<T extends ReqCode = ReqCode> = (result?: Response<T>) => void
    }

    namespace focus {
        type Method = 'focus' | 'pomodoro'

        type FilterPolicy = 'allow' | 'block'

        type Config = {
            method: Method
            // Filter policy of urls
            policy: FilterPolicy
            // Site conditions to block during focus, supports wildcard patterns
            cond: string[]
            // Focus duration in seconds. Undefined means no limit.
            duration?: number
            // Break duration in seconds. If great than 0, means that cycle is enable
            break?: number
            allowDelay?: boolean
        }

        /**
         * A focus preset defines a named set of blocking conditions
         * that can be activated as a "focus mode".
         */
        type Preset = {
            // Current timestamp
            id: number
            // Display name of this preset (e.g. "Work Mode", "Study Mode")
            name: string
        } & Config

        type State = 'running' | 'paused' | 'done' | 'aborted'

        type Action = 'start' | 'pause' | 'resume' | 'abort' | 'finish'

        type Phase = 'focus' | 'break'

        type Session = Config & {
            // Start time with ts
            start: number
            end: number
            presetId?: number
            // Actual duration(milliseconds) in this cycle
            currentDuration: number
            // Total actual focus duration(milliseconds)
            totalFocus: number
            state: State
            phase: Phase
            logs: { action: Action, ts: number, phase: Phase }[]
        }

        type ActionRequest = {
            action: 'start'
            config: Config
            presetId?: number
        } | 'pause' | 'resume' | 'abort' | 'delay' | 'dismiss'
    }
}
