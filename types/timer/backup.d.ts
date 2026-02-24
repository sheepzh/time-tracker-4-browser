/**
 * @since 1.2.0
 */
declare namespace timer.backup {

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
     * timer.backup.Coordinator of data synchronizer
     */
    interface Coordinator<Cache> {
        /**
         * Register for client
         */
        updateClients(context: timer.backup.CoordinatorContext<Cache>, clients: Client[]): Promise<void>
        /**
         * List all clients
         */
        listAllClients(context: timer.backup.CoordinatorContext<Cache>): Promise<Client[]>
        /**
         * Download fragmented data from cloud
         *
         * @param targetCid The client id, default value is the local one in context
         */
        download(context: timer.backup.CoordinatorContext<Cache>, dateStart: Date, dateEnd: Date, targetCid?: string): Promise<timer.core.Row[]>
        /**
         * Upload fragmented data to cloud
         * @param rows
         */
        upload(context: timer.backup.CoordinatorContext<Cache>, rows: timer.core.Row[]): Promise<void>
        /**
         * Test auth
         *
         * @returns errorMsg or null/undefined
         */
        testAuth(auth: Auth, ext: timer.backup.TypeExt): Promise<string | undefined>
        /**
         * Clear data
         */
        clear(context: timer.backup.CoordinatorContext<Cache>, client: timer.backup.Client): Promise<void>
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

    /**
     * Snapshot of last backup
     */
    type Snapshot = {
        /**
         * Timestamp
         */
        ts: number
        /**
         * The date of the ts
         */
        date: string
    }

    /**
     * Snapshot cache
     */
    type SnapshotCache = Partial<{
        [type in Type]: Snapshot
    }>

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
        __stat__?: timer.core.Row[]
        __limit__?: timer.limit.Rule[]
        __merge__?: timer.merge.Rule[]
        __whitelist__?: string[]
        __cate__?: timer.site.Cate[]
        // Legacy data before v4.0.0
        [key: string]: unknown
    }
}