/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import syncDb from "@db/backup-database"
import statDb from "@db/stat-database"
import optionHolder from "../components/option-holder"
import { getCid, updateBackUpTime } from "../meta-service"
import GistCoordinator from "./gist/coordinator"
import ObsidianCoordinator from "./obsidian/coordinator"
import WebDAVCoordinator from "./web-dav/coordinator"

type AuthCheckResult = {
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

async function syncFull(
    context: timer.backup.CoordinatorContext<unknown>,
    coordinator: timer.backup.Coordinator<unknown>,
    client: timer.backup.Client
): Promise<void> {
    // 1. select rows
    const rows = await statDb.select()
    const allDates = rows.map(r => r.date).sort((a, b) => a == b ? 0 : a > b ? 1 : -1)
    client.maxDate = allDates[allDates.length - 1]
    client.minDate = allDates[0]
    // 2. upload
    await coordinator.upload(context, rows)
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

    async syncData(): Promise<string | undefined> {
        const { option, auth, ext, type, coordinator, errorMsg } = await this.checkAuth()
        if (errorMsg) return errorMsg

        const cid = await getCid()
        const context: timer.backup.CoordinatorContext<unknown> = await new CoordinatorContextWrapper<unknown>(cid, auth, ext, type).init()
        const client: timer.backup.Client = {
            id: cid,
            name: option.clientName,
            minDate: undefined,
            maxDate: undefined
        }
        try {
            await syncFull(context, coordinator, client)
            const clients = (await coordinator.listAllClients(context)).filter(a => a.id !== cid)
            clients.push(client)
            await coordinator.updateClients(context, clients)
            // Update time
            await updateBackUpTime(type, Date.now())
        } catch (e) {
            console.error("Error to sync data", e)
            return e instanceof Error ? e.message : String(e ?? 'Unknown Error')
        }
    }

    async listClients(): Promise<(timer.backup.Client & { current: boolean })[]> {
        const { auth, ext, type, coordinator, errorMsg } = await this.checkAuth()
        if (errorMsg) throw new Error(errorMsg)
        const cid = await getCid()
        const context = await new CoordinatorContextWrapper<unknown>(cid, auth, ext, type).init()
        const clients = await coordinator.listAllClients(context)
        return clients.map(c => ({ ...c, current: c.id === cid }))
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

    async query(param: timer.backup.RemoteQuery): Promise<timer.backup.Row[]> {
        const { type, coordinator, auth, ext, errorMsg } = await this.checkAuth()
        if (errorMsg || !coordinator) {
            return []
        }

        const { start, end, specCid, excludeLocal } = param
        let localCid = await getCid()
        // 1. init context
        const context: timer.backup.CoordinatorContext<unknown> = await new CoordinatorContextWrapper<unknown>(localCid, auth, ext, type).init()
        // 2. query all clients, and filter them
        const allClients = (await coordinator.listAllClients(context))
            .filter(c => filterClient(c, !!excludeLocal, localCid, start, end))
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

    async clear(cid: string): Promise<string | undefined> {
        const { auth, ext, type, coordinator, errorMsg } = await this.checkAuth()
        if (errorMsg) return errorMsg
        let localCid = await getCid()
        const context: timer.backup.CoordinatorContext<unknown> = await new CoordinatorContextWrapper<unknown>(localCid, auth, ext, type).init()
        // 1. Find the client
        const allClients = await coordinator.listAllClients(context)
        const client = allClients?.filter(c => c?.id === cid)?.[0]
        if (!client) return
        // 2. clear
        await coordinator.clear(context, client)
        // 3. remove client
        const newClients = allClients.filter(c => c?.id !== cid)
        await coordinator.updateClients(context, newClients)
    }
}

export default new Processor()