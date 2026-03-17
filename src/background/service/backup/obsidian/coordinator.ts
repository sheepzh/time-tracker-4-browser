import {
    DEFAULT_VAULT,
    deleteFile,
    getFileContent,
    INVALID_AUTH_CODE,
    listAllFiles,
    NOT_FOUND_CODE,
    type ObsidianRequestContext,
    updateFile
} from "@api/obsidian"
import DateIterator from "@util/date-iterator"
import { processDir } from "../common"
import { CLIENT_FILE_NAME, convertClients2Markdown, divideByDate, parseData } from "../markdown"

function prepareContext(context: timer.backup.CoordinatorContext<never>) {
    const { auth, ext, cid } = context
    const { token } = auth || {}
    if (!token) {
        throw new Error("Token must not be empty. This can't happen, please contact the developer")
    }
    let { endpoint, dirPath, bucket } = ext || {}
    dirPath = processDir(dirPath)
    const ctx: ObsidianRequestContext = { auth: token, endpoint, vault: bucket }
    return { ctx, dirPath, cid }
}

export default class ObsidianCoordinator implements timer.backup.Coordinator<never> {

    async updateClients(context: timer.backup.CoordinatorContext<never>, clients: timer.backup.Client[]): Promise<void> {
        const { ctx, dirPath } = prepareContext(context)
        const clientFilePath = `${dirPath}${CLIENT_FILE_NAME}`
        const content = convertClients2Markdown(clients)
        await updateFile(ctx, clientFilePath, content)
    }

    async listAllClients(context: timer.backup.CoordinatorContext<never>): Promise<timer.backup.Client[]> {
        const { ctx, dirPath } = prepareContext(context)
        const clientFilePath = `${dirPath}${CLIENT_FILE_NAME}`
        try {
            const content = await getFileContent(ctx, clientFilePath)
            return parseData(content) || []
        } catch (e) {
            console.error(e)
            return []
        }
    }

    async download(context: timer.backup.CoordinatorContext<never>, dateStart: Date, dateEnd: Date, targetCid?: string): Promise<timer.core.Row[]> {
        const { ctx, dirPath, cid } = prepareContext(context)

        const dateIterator = new DateIterator(dateStart, dateEnd)
        const result: timer.core.Row[] = []
        await Promise.all(dateIterator.toArray().map(async date => {
            const filePath = `${dirPath}${targetCid || cid}/${date}.md`
            const fileContent = await getFileContent(ctx, filePath)
            const rows = parseData<timer.core.Row[]>(fileContent)
            rows?.forEach?.(row => result.push(row))
        }))
        return result
    }

    async upload(context: timer.backup.CoordinatorContext<never>, rows: timer.core.Row[]): Promise<void> {
        const { ctx, dirPath, cid } = prepareContext(context)

        const dateAndContents = divideByDate(rows)
        await Promise.all(
            Object.entries(dateAndContents).map(async ([date, content]) => {
                const filePath = `${dirPath}${cid}/${date}.md`
                await updateFile(ctx, filePath, content)
            })
        )
    }

    async testAuth(authInfo: timer.backup.Auth, ext: timer.backup.TypeExt): Promise<string | undefined> {
        let { endpoint, dirPath, bucket } = ext || {}
        let { token: auth } = authInfo || {}
        dirPath = processDir(dirPath)
        if (!dirPath) {
            return "Path of directory is blank"
        }
        if (!auth) {
            return "Authorization is blank"
        }
        try {
            const result = await listAllFiles({ endpoint, auth, vault: bucket }, dirPath)
            const { errorCode, message } = result || {}
            if (errorCode === NOT_FOUND_CODE) {
                return `Directory[vault=${bucket || DEFAULT_VAULT}, path=${dirPath}] not found`
            } else if (errorCode === INVALID_AUTH_CODE) {
                return 'Your authorization token is invalid'
            }
            return message
        } catch (e) {
            const { message: errMsg } = e as Error
            const lowerErrMsg = errMsg?.toLocaleLowerCase?.()
            if (lowerErrMsg?.includes("failed to fetch")) {
                return "Unable to fetch this endpoint, please make sure it is accessible"
            } else if (lowerErrMsg?.includes("failed to parse url from")) {
                return "The endpoint is invalid, please check it"
            }
            return errMsg ?? e?.toString?.() ?? 'Unknown error'
        }
    }

    async clear(context: timer.backup.CoordinatorContext<never>, client: timer.backup.Client): Promise<void> {
        const cid = client.id
        const { ctx, dirPath } = prepareContext(context)
        const clientDirPath = `${dirPath}${cid}/`
        let files: string[] = []
        try {
            const result = await listAllFiles(ctx, clientDirPath)
            files = result.files || []
        } catch { }
        await Promise.all(
            files.map(async file => {
                const filePath = clientDirPath + file
                await deleteFile(ctx, filePath)
            })
        )
    }
}