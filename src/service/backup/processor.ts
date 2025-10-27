/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import syncDb from "@db/backup-database"
import optionHolder from "@service/components/option-holder"
import itemService from "@service/item-service"
import { getCid, updateBackUpTime, updateCid } from "@service/meta-service"
import { formatTimeYMD, getBirthday } from "@util/time"
import GistCoordinator from "./gist/coordinator"
import ObsidianCoordinator from "./obsidian/coordinator"
import WebDAVCoordinator from "./web-dav/coordinator"

export type AuthCheckResult = {
    option: timer.option.BackupOption
    auth: timer.backup.Auth
    ext: timer.backup.TypeExt
    type: timer.backup.Type
    coordinator: timer.backup.Coordinator<unknown>
    errorMsg?: string
}

class CoordinatorContextWrapper<Cache> implements timer.backup.CoordinatorContext<Cache> {
    auth: timer.backup.Auth
    ext?: timer.backup.TypeExt
    cache: Cache = {} as unknown as Cache
    type: timer.backup.Type
    cid: string

    constructor(cid: string, auth: timer.backup.Auth, ext: timer.backup.TypeExt, type: timer.backup.Type) {
        this.cid = cid
        this.auth = auth
        this.ext = ext
        this.type = type
    }

    async init(): Promise<timer.backup.CoordinatorContext<Cache>> {
        this.cache = await syncDb.getCache(this.type) as Cache
        return this
    }

    handleCacheChanged(): Promise<void> {
        return syncDb.updateCache(this.type, this.cache)
    }
}

/**
 * Declare type of NavigatorUAData
 */
type NavigatorUAData = {
    brands?: {
        brand?: string
        version?: string
    }[]
    platform?: string
}

type Result<T> = {
    success: boolean
    errorMsg?: string
    data?: T
}

function error<T>(msg: string): Result<T> {
    return { success: false, errorMsg: msg, }
}

function success<T>(data?: T): Result<T> {
    return { success: true, data }
}

function generateCid() {
    const uaData = (navigator as any)?.userAgentData as NavigatorUAData
    let prefix = 'unknown'
    if (uaData) {
        const brand = uaData.brands
            ?.map(e => e.brand)
            ?.filter(brand => brand && brand !== "Chromium" && !brand.includes("Not"))
            ?.[0]
            ?.replace(' ', '-')
        const platform = uaData.platform
        brand && platform && (prefix = `${platform.toLowerCase()}-${brand.toLowerCase()}`)
    }
    return prefix + '-' + new Date().getTime()
}

/**
 * Get client id or generate it lazily
 */
async function lazyGetCid(): Promise<string> {
    let cid = await getCid()
    if (!cid) {
        cid = generateCid()
        await updateCid(cid)
    }
    return cid
}

async function syncFull(
    context: timer.backup.CoordinatorContext<unknown>,
    coordinator: timer.backup.Coordinator<unknown>,
    client: timer.backup.Client
): Promise<timer.backup.Snapshot> {
    // 1. select rows
    let start = getBirthday()
    let end = new Date()
    const rows = await itemService.selectItems({ date: [start, end] })
    const allDates = rows.map(r => r.date).sort((a, b) => a == b ? 0 : a > b ? 1 : -1)
    client.maxDate = allDates[allDates.length - 1]
    client.minDate = allDates[0]
    // 2. upload
    await coordinator.upload(context, rows)
    return {
        ts: end.getTime(),
        date: formatTimeYMD(end),
    }
}

function filterClient(c: timer.backup.Client, excludeLocal: boolean, localClientId: string, start?: string, end?: string) {
    // Exclude local client
    if (excludeLocal && c.id === localClientId) return false
    // Judge range
    if (start && c.maxDate && c.maxDate < start) return false
    if (end && c.minDate && c.minDate > end) return false
    return true
}

function prepareAuth(option: timer.option.BackupOption): timer.backup.Auth {
    const type = option?.backupType || 'none'
    const token = option?.backupAuths?.[type]
    const login = option.backupLogin?.[type]
    return { token, login }
}

export type RemoteQueryParam = {
    start: Date
    end: Date
    specCid?: string
    excludeLocal?: boolean
}

class Processor {
    coordinators: {
        [type in timer.backup.Type]: timer.backup.Coordinator<unknown>
    }

    constructor() {
        this.coordinators = {
            none: null as unknown as timer.backup.Coordinator<never>,
            gist: new GistCoordinator(),
            obsidian_local_rest_api: new ObsidianCoordinator(),
            web_dav: new WebDAVCoordinator(),
        }
    }

    async syncData(): Promise<Result<number>> {
        const { option, auth, ext, type, coordinator, errorMsg } = await this.checkAuth()
        if (errorMsg) return error(errorMsg)

        const cid = await lazyGetCid()
        const context: timer.backup.CoordinatorContext<unknown> = await new CoordinatorContextWrapper<unknown>(cid, auth, ext, type).init()
        const client: timer.backup.Client = {
            id: cid,
            name: option.clientName,
            minDate: undefined,
            maxDate: undefined
        }
        try {
            let snapshot: timer.backup.Snapshot = await syncFull(context, coordinator, client)
            await syncDb.updateSnapshot(type, snapshot)
            const clients: timer.backup.Client[] = (await coordinator.listAllClients(context)).filter(a => a.id !== cid) || []
            clients.push(client)
            await coordinator.updateClients(context, clients)
            // Update time
            const now = Date.now()
            updateBackUpTime(type, now)
            return success(now)
        } catch (e) {
            console.error("Error to sync data", e)
            const msg = (e as Error)?.message ?? e?.toString?.()
            return error(msg)
        }
    }

    async listClients(): Promise<Result<timer.backup.Client[]>> {
        const { auth, ext, type, coordinator, errorMsg } = await this.checkAuth()
        if (errorMsg) return error(errorMsg)
        const cid = await lazyGetCid()
        const context: timer.backup.CoordinatorContext<unknown> = await new CoordinatorContextWrapper<unknown>(cid, auth, ext, type).init()
        const clients = await coordinator.listAllClients(context)
        return success(clients)
    }

    async checkAuth(): Promise<AuthCheckResult> {
        const option = await optionHolder.get()
        const { backupType: type, backupExts } = option
        const ext = backupExts?.[type] ?? {}
        const auth = prepareAuth(option)

        const coordinator: timer.backup.Coordinator<unknown> = type && this.coordinators[type]
        if (!coordinator) {
            // no coordinator, do nothing
            return { option, auth, ext, type, coordinator, errorMsg: "Invalid type" }
        }
        let errorMsg
        try {
            errorMsg = await coordinator.testAuth(auth, ext)
        } catch (e) {
            errorMsg = (e as Error)?.message || 'Unknown error'
        }
        return { option, auth, ext, type, coordinator, errorMsg }
    }

    async query(param: RemoteQueryParam): Promise<timer.backup.Row[]> {
        const { type, coordinator, auth, ext, errorMsg } = await this.checkAuth()
        if (errorMsg || !coordinator) {
            return []
        }

        const { start = getBirthday(), end, specCid, excludeLocal } = param
        let localCid = await lazyGetCid()
        // 1. init context
        const context: timer.backup.CoordinatorContext<unknown> = await new CoordinatorContextWrapper<unknown>(localCid, auth, ext, type).init()
        // 2. query all clients, and filter them
        let startStr = start ? formatTimeYMD(start) : undefined
        let endStr = end ? formatTimeYMD(end) : undefined
        const allClients = (await coordinator.listAllClients(context))
            .filter(c => filterClient(c, !!excludeLocal, localCid, startStr, endStr))
            .filter(c => !specCid || c.id === specCid)
        // 3. iterate clients
        const result: timer.backup.Row[] = []
        await Promise.all(
            allClients.map(async client => {
                const { id, name } = client
                const rows = await coordinator.download(context, start, end, id)
                rows.forEach(row => result.push({
                    ...row,
                    cid: id,
                    cname: name,
                }))
            })
        )
        console.log(`Queried ${result.length} remote items`)
        return result
    }

    async clear(cid: string): Promise<Result<void>> {
        const { auth, ext, type, coordinator, errorMsg } = await this.checkAuth()
        if (errorMsg) return error(errorMsg)
        let localCid = await lazyGetCid()
        const context: timer.backup.CoordinatorContext<unknown> = await new CoordinatorContextWrapper<unknown>(localCid, auth, ext, type).init()
        // 1. Find the client
        const allClients = await coordinator.listAllClients(context)
        const client = allClients?.filter(c => c?.id === cid)?.[0]
        if (!client) {
            return success()
        }
        // 2. clear
        await coordinator.clear(context, client)
        // 3. remove client
        const newClients = allClients.filter(c => c?.id !== cid)
        await coordinator.updateClients(context, newClients)

        return success()
    }
}

export default new Processor()