/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import {
    createGist, findTarget, getGist, getJsonFileContent, testToken, updateGist,
    type FileForm, type Gist, type GistForm
} from "@api/gist"
import { SOURCE_CODE_PAGE } from "@util/constant/url"
import MonthIterator from "@util/month-iterator"
import { formatTimeYMD } from "@util/time"
import { calcAllBuckets, divide2Buckets, gistData2Rows, type GistData } from "./compressor"

const TIMER_META_GIST_DESC = "Used for timer to save meta info. Don't change this description :)"
const TIMER_DATA_GIST_DESC = "Used for timer to save stat data. Don't change this description :)"

const README_FILE_NAME = "README.md"
const CLIENT_FILE_NAME = "clients.json"

const INIT_README_MD: FileForm = {
    filename: README_FILE_NAME,
    content: `Created by [TIMER](${SOURCE_CODE_PAGE}) automatically, please DO NOT edit this gist!`
}

const INIT_CLIENT_JSON: FileForm = {
    filename: CLIENT_FILE_NAME,
    content: "[]"
}

/**
 * Local cache of gist
 */
type Cache = {
    /**
     * Gist id with meta info
     */
    metaGistId: string
    /**
     * Gist id with stat info
     */
    statGistId: string
}

function bucket2filename(bucket: string, cid: string) {
    return `${bucket}_${cid}.json`
}

function filterDate(row: timer.core.Row, start: string, end: string) {
    const { date } = row
    if (!date) return false
    if (start && date < start) return false
    if (end && date > end) return false
    return true
}

function checkTokenExist(context: timer.backup.CoordinatorContext<Cache>): string {
    const token = context.auth?.token
    if (!token) {
        throw new Error("Token must not be empty. This can't happen, please contact to the developer")
    }
    return token
}

export default class GistCoordinator implements timer.backup.Coordinator<Cache> {
    async updateClients(
        context: timer.backup.CoordinatorContext<Cache>,
        clients: timer.backup.Client[],
    ): Promise<void> {
        const gist = await this.getMetaGist(context)
        if (!gist) {
            return
        }
        const files: { [filename: string]: FileForm } = {}
        files[README_FILE_NAME] = INIT_README_MD
        files[CLIENT_FILE_NAME] = {
            filename: CLIENT_FILE_NAME,
            content: JSON.stringify(clients)
        }
        await updateGist(checkTokenExist(context), gist.id, { description: gist.description, public: false, files })
    }

    async listAllClients(context: timer.backup.CoordinatorContext<Cache>): Promise<timer.backup.Client[]> {
        const gist = await this.getMetaGist(context)
        if (!gist) {
            return []
        }
        const file = gist?.files[CLIENT_FILE_NAME]
        return file ? await getJsonFileContent(file) ?? [] : []
    }

    async download(context: timer.backup.CoordinatorContext<Cache>, startTime: Date, endTime: Date, targetCid?: string): Promise<timer.core.Row[]> {
        const allYearMonth = new MonthIterator(startTime, endTime || new Date()).toArray()
        const result: timer.core.Row[] = []
        const start = formatTimeYMD(startTime)
        const end = formatTimeYMD(endTime)
        await Promise.all(allYearMonth.map(async yearMonth => {
            const filename = bucket2filename(yearMonth, targetCid || context.cid)
            const gist: Gist = await this.getStatGist(context)
            const file = gist.files[filename]
            if (file) {
                const gistData = await getJsonFileContent<GistData>(file)
                const rows = gistData && gistData2Rows(yearMonth, gistData)
                rows?.filter(row => filterDate(row, start, end))
                    ?.forEach(row => result.push(row))
            }
        }))
        return result
    }

    async upload(context: timer.backup.CoordinatorContext<Cache>, rows: timer.core.Row[]): Promise<void> {
        const cid = context.cid
        const buckets = divide2Buckets(rows)
        const gist = await this.getStatGist(context)
        const files2Update: { [filename: string]: FileForm } = {}
        for (const [bucket, gistData] of buckets) {
            const filename = bucket2filename(bucket, cid)
            let content: string = JSON.stringify(gistData)
            files2Update[filename] = { content, filename }
        }

        const gist2update: GistForm = {
            public: false,
            files: files2Update,
            description: TIMER_DATA_GIST_DESC
        }
        updateGist(checkTokenExist(context), gist.id, gist2update)
    }

    private isTargetMetaGist(gist: Gist): boolean {
        return gist.description === TIMER_META_GIST_DESC
    }

    private isTargetStatGist(gist: Gist): boolean {
        return gist.description === TIMER_DATA_GIST_DESC
    }

    private async getMetaGist(context: timer.backup.CoordinatorContext<Cache>): Promise<Gist> {
        const gistId = context.cache.metaGistId
        const token = checkTokenExist(context)
        // 1. Find by id
        if (gistId) {
            const gist = await getGist(token, gistId)
            if (gist && this.isTargetMetaGist(gist)) {
                return gist
            }
        }
        // 2. Find another
        const anotherGist = await findTarget(token, gist => this.isTargetMetaGist(gist))
        if (anotherGist) {
            context.cache.metaGistId = anotherGist.id
            context.handleCacheChanged()
            return anotherGist
        }
        // 3. Create new one
        const files: Record<string, FileForm> = {}
        files[INIT_README_MD.filename] = INIT_README_MD
        files[INIT_CLIENT_JSON.filename] = INIT_CLIENT_JSON
        const gist2Create: GistForm = { description: TIMER_META_GIST_DESC, files, public: false }
        const created = await createGist(token, gist2Create)
        const newId = created?.id
        newId && (context.cache.metaGistId = newId) && context.handleCacheChanged()
        return created
    }

    private async getStatGist(context: timer.backup.CoordinatorContext<Cache>): Promise<Gist> {
        const gistId = context.cache.statGistId
        const token = checkTokenExist(context)
        // 1. Find by id
        if (gistId) {
            const gist = await getGist(token, gistId)
            if (gist && this.isTargetStatGist(gist)) {
                return gist
            }
        }
        // 2. Find another
        const anotherGist = await findTarget(token, gist => this.isTargetStatGist(gist))
        if (anotherGist) {
            context.cache.statGistId = anotherGist.id
            context.handleCacheChanged()
            return anotherGist
        }
        // 3. Create new one
        const files: Record<string, FileForm> = {}
        files[README_FILE_NAME] = INIT_README_MD
        const gist2Create: GistForm = { description: TIMER_DATA_GIST_DESC, files, public: false }
        const created = await createGist(token, gist2Create)
        const newId = created?.id
        newId && (context.cache.statGistId = newId) && context.handleCacheChanged()
        return created
    }

    async testAuth(auth: timer.backup.Auth): Promise<string | undefined> {
        const { token } = auth
        if (!token) return 'Token is empty'
        return testToken(token)
    }

    async clear(context: timer.backup.CoordinatorContext<Cache>, client: timer.backup.Client): Promise<void> {
        // 1. Find the names of file to delete
        const { minDate, maxDate, id: cid } = client || {}
        const allBuckets = calcAllBuckets(minDate, maxDate)
        const allFileNames = allBuckets.map(bucket => bucket2filename(bucket, cid))
        const gist = await this.getStatGist(context)
        const deletingFileNames = Object.keys(gist?.files || {}).filter(fileName => allFileNames.includes(fileName))
        // 2. delete
        const files2Delete: { [filename: string]: FileForm | null } = {}
        deletingFileNames.forEach(fileName => files2Delete[fileName] = null)
        const gist2update: GistForm = {
            public: false,
            files: files2Delete,
            description: TIMER_DATA_GIST_DESC
        }
        await updateGist(checkTokenExist(context), gist.id, gist2update)
    }
}
