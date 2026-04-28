import Crowdin, {
    type Credentials,
    type Pagination,
    type PatchRequest,
    type ResponseList,
    type SourceFilesModel,
    type SourceStringsModel,
    type StringTranslationsModel,
    type UploadStorageModel,
} from '@crowdin/crowdin-api-client'
import { ALL_CROWDIN_LANGUAGES, type CrowdinLanguage, type Dir, type ItemSet } from './common'

const PROJECT_ID = 516822

const MAIN_BRANCH_NAME = 'main'

/**
 * The iterator of response
 */
class PaginationIterator<T> {
    private offset = 0
    private limit = 25
    private isEnd = false
    private buf: T[] = []
    private cursor = 0
    private query: (pagination: Pagination) => Promise<ResponseList<T>>

    constructor(query: (pagination: Pagination) => Promise<ResponseList<T>>) {
        this.query = query
    }

    reset(): void {
        this.offset = 0
        this.isEnd = false
        this.buf = []
        this.cursor = 0
    }

    async findFirst(predicate: (ele: T) => boolean): Promise<T | undefined> {
        while (true) {
            const data = await this.next()
            if (!data) {
                break
            }
            if (data && predicate(data)) {
                return data
            }
        }
        return undefined
    }

    async findAll(predicate?: ((ele: T) => boolean)): Promise<T[]> {
        const result: T[] = []
        while (true) {
            const data = await this.next()
            if (!data) {
                break
            }
            if (predicate ? predicate(data) : true) {
                result.push(data)
            }
        }
        return result
    }

    async next(): Promise<T | undefined> {
        if (this.isEnd) {
            return undefined
        }
        if (this.cursor >= this.buf.length) {
            await this.processBuf()
        }
        if (this.isEnd) {
            return undefined
        }
        return this.buf[this.cursor++]
    }

    private async processBuf() {
        const pagination: Pagination = { offset: this.offset, limit: this.limit }
        const list = await this.query(pagination)
        const data = list.data
        if (!data.length) {
            this.isEnd = true
        } else {
            this.buf = data.map(obj => obj.data)
            this.cursor = 0
            this.offset += this.buf.length
        }
    }
}

/**
 * Key of crowdin file/directory
 */
export type NameKey = {
    name: Dir
    branchId: number
}

type TranslationKey = {
    stringId: number
    lang: CrowdinLanguage
}

/**
 * The wrapper of client with auth
 */
export class CrowdinClient {
    crowdin: Crowdin

    constructor(token: string) {
        const credentials: Credentials = {
            token: token
        }
        this.crowdin = new Crowdin(credentials)
        console.info("Initialized client successfully")
    }

    async createStorage(fileName: string, content: any): Promise<UploadStorageModel.Storage> {
        const response = await this.crowdin.uploadStorageApi.addStorage(fileName, content)
        return response.data
    }

    /**
     * Get the main branch
     *
     * @returns main branch or undefined
     */

    async getMainBranch(): Promise<SourceFilesModel.Branch | undefined> {
        return new PaginationIterator(
            pagination => this.crowdin.sourceFilesApi.listProjectBranches(PROJECT_ID, { ...pagination })
        ).findFirst(e => e.name === MAIN_BRANCH_NAME)
    }

    /**
     * Create the main branch
     */
    async createMainBranch(): Promise<SourceFilesModel.Branch> {
        const request: SourceFilesModel.CreateBranchRequest = {
            name: MAIN_BRANCH_NAME
        }
        const res = await this.crowdin.sourceFilesApi.createBranch(PROJECT_ID, request)
        return res.data
    }

    async getOrCreateMainBranch(): Promise<SourceFilesModel.Branch> {
        let branch = await this.getMainBranch()
        if (!branch) {
            branch = await this.createMainBranch()
        }
        console.info("getOrCreateMainBranch: " + JSON.stringify(branch))
        return branch
    }

    async createFile(
        directoryId: number,
        storage: UploadStorageModel.Storage,
        fileName: string
    ): Promise<SourceFilesModel.File> {
        const request: SourceFilesModel.CreateFileRequest = {
            name: fileName,
            storageId: storage.id,
            directoryId,
            type: 'json',
        }
        const response = await this.crowdin.sourceFilesApi.createFile(PROJECT_ID, request)
        return response.data
    }

    async restoreFile(storage: UploadStorageModel.Storage, existFile: SourceFilesModel.File): Promise<SourceFilesModel.File> {
        const response = await this.crowdin.sourceFilesApi.updateOrRestoreFile(PROJECT_ID, existFile.id, { storageId: storage.id })
        return response.data
    }

    getFileByName(param: NameKey): Promise<SourceFilesModel.File | undefined> {
        return new PaginationIterator(
            p => this.crowdin.sourceFilesApi.listProjectFiles(PROJECT_ID, { ...p, branchId: param.branchId })
        ).findFirst(t => t.name === param.name)
    }

    getDirByName(param: NameKey): Promise<SourceFilesModel.Directory | undefined> {
        return new PaginationIterator(
            p => this.crowdin.sourceFilesApi.listProjectDirectories(PROJECT_ID, { ...p, branchId: param.branchId })
        ).findFirst(d => d.name === param.name)
    }

    async createDirectory(param: NameKey): Promise<SourceFilesModel.Directory> {
        const res = await this.crowdin.sourceFilesApi.createDirectory(PROJECT_ID, {
            name: param.name,
            branchId: param.branchId,
        })
        return res.data
    }

    listFilesByDirectory(directoryId: number) {
        return new PaginationIterator(
            p => this.crowdin.sourceFilesApi.listProjectFiles(PROJECT_ID, { ...p, directoryId: directoryId })
        ).findAll()
    }

    listStringsByFile(fileId: number): Promise<SourceStringsModel.String[]> {
        return new PaginationIterator(
            p => this.crowdin.sourceStringsApi.listProjectStrings(PROJECT_ID, { ...p, fileId: fileId })
        ).findAll()
    }

    async batchCreateString(
        fileId: number,
        content: ItemSet,
    ): Promise<void> {
        for (const [path, value] of Object.entries(content)) {
            const request: SourceStringsModel.CreateStringRequest = {
                fileId,
                text: value,
                identifier: path,
            }
            console.log(`Try to create new string: ${JSON.stringify(request)}`)
            await this.crowdin.sourceStringsApi.addString(PROJECT_ID, request)
        }
    }

    async batchUpdateIfNecessary(
        content: ItemSet,
        existStringsKeyMap: { [path: string]: SourceStringsModel.String }
    ): Promise<void> {
        console.log("=========start to update strings========")
        console.log("Content length: " + Object.keys(content).length)
        for (const [path, value] of Object.entries(content)) {
            const string = existStringsKeyMap[path]
            if (!string) continue
            const patch: PatchRequest[] = []
            string.text !== value && patch.push({
                op: 'replace',
                path: '/text',
                value: value
            })
            if (!patch.length) continue
            console.log('Try to edit string: ' + string.identifier)
            await this.crowdin.sourceStringsApi.editString(PROJECT_ID, string.id, patch)
        }
        console.log("=========end to update strings========")
    }

    async batchDeleteString(stringIds: number[]): Promise<void> {
        console.log("=========start to delete strings========")
        for (const stringId of stringIds) {
            await this.crowdin.sourceStringsApi.deleteString(PROJECT_ID, stringId)
            console.log("Delete string: id=" + stringId)
        }
        console.log("=========end to delete strings========")
    }

    async listTranslationByStringAndLang(transKey: TranslationKey): Promise<StringTranslationsModel.StringTranslation[]> {
        const { stringId, lang } = transKey
        return await new PaginationIterator(
            p => this.crowdin.stringTranslationsApi.listStringTranslations(PROJECT_ID, stringId, lang, { ...p })
        ).findAll()
    }

    async deleteTranslation(translationId: number): Promise<void> {
        await this.crowdin.stringTranslationsApi.deleteTranslation(PROJECT_ID, translationId)
    }

    async createTranslation(transKey: TranslationKey, text: string) {
        const { stringId, lang } = transKey
        const request: StringTranslationsModel.AddStringTranslationRequest = {
            stringId,
            languageId: lang,
            text
        }
        await this.crowdin.stringTranslationsApi.addTranslation(PROJECT_ID, request)
    }

    async buildProjectTranslation(branchId: number) {
        const buildRes = await this.crowdin.translationsApi.buildProject(PROJECT_ID, {
            branchId,
            targetLanguageIds: [...ALL_CROWDIN_LANGUAGES],
            skipUntranslatedStrings: true,
        })
        const buildId = buildRes.data.id
        while (true) {
            // Wait finished
            const res = await this.crowdin.translationsApi.downloadTranslations(PROJECT_ID, buildId)
            return res.data.url
        }
    }
}

/**
 * Get the client from environment variable [TIMER_CROWDIN_AUTH]
 *
 * @returns client
 */
export function getClientFromEnv(): CrowdinClient {
    const envVar = process.env.TIMER_CROWDIN_AUTH
    if (!envVar) {
        console.error("Failed to get the variable named [TIMER_CROWDIN_AUTH]")
        process.exit(1)
    }
    return new CrowdinClient(envVar)
}
