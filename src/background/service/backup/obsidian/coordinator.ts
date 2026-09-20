import { deleteFile, getFileContent, listAllFiles, OBSIDIAN_DEFAULTS, type ObsidianRequestContext, updateFile } from "@api/obsidian"
import DateIterator from "@util/date-iterator"
import { getBirthday, parseTime } from '@util/time'
import { processDir } from "../common"
import { CLIENT_FILE_NAME, convertClients2Markdown, divideByDate, parseData } from "../markdown"

const INVALID_AUTH_CODE = 40101
const NOT_FOUND_CODE = 40400

function prepareContext(auth: tt4b.backup.Auth | undefined, ext: tt4b.backup.TypeExt | undefined) {
    const { token } = auth ?? {}
    if (!token) throw new Error("Token must not be empty")
    let { endpoint, dirPath, bucket: vault } = ext ?? {}
    endpoint ||= OBSIDIAN_DEFAULTS.endpoint
    vault ||= OBSIDIAN_DEFAULTS.vault
    dirPath = processDir(dirPath)
    const ctx: ObsidianRequestContext = { auth: token, endpoint, vault }
    return { ctx, dirPath }
}

export default class ObsidianCoordinator implements tt4b.backup.Coordinator<never> {

    async updateClients({ auth, ext }: tt4b.backup.CoordinatorContext<never>, clients: tt4b.backup.Client[]): Promise<void> {
        const { ctx, dirPath } = prepareContext(auth, ext)
        const clientFilePath = `${dirPath}${CLIENT_FILE_NAME}`
        const content = convertClients2Markdown(clients)
        await updateFile(ctx, clientFilePath, content)
    }

    async listAllClients({ auth, ext }: tt4b.backup.CoordinatorContext<never>): Promise<tt4b.backup.Client[]> {
        const { ctx, dirPath } = prepareContext(auth, ext)
        const clientFilePath = `${dirPath}${CLIENT_FILE_NAME}`
        try {
            const content = await getFileContent(ctx, clientFilePath)
            return parseData(content) || []
        } catch (e) {
            console.error(e)
            return []
        }
    }

    async download({ auth, ext, cid }: tt4b.backup.CoordinatorContext<never>, start: string, end: string, targetCid?: string): Promise<tt4b.core.Row[]> {
        const { ctx, dirPath } = prepareContext(auth, ext)

        const startTime = parseTime(start) ?? getBirthday()
        const endTime = parseTime(end) ?? new Date()
        const dateIterator = new DateIterator(startTime, endTime)
        const result: tt4b.core.Row[] = []
        await Promise.all([...dateIterator].map(async date => {
            const filePath = `${dirPath}${targetCid || cid}/${date}.md`
            const fileContent = await getFileContent(ctx, filePath)
            const rows = parseData<tt4b.core.Row[]>(fileContent)
            rows?.forEach?.(row => result.push(row))
        }))
        return result
    }

    async upload({ auth, ext, cid }: tt4b.backup.CoordinatorContext<never>, rows: tt4b.core.Row[]): Promise<void> {
        const { ctx, dirPath } = prepareContext(auth, ext)

        const dateAndContents = divideByDate(rows)
        await Promise.all(
            Object.entries(dateAndContents).map(async ([date, content]) => {
                const filePath = `${dirPath}${cid}/${date}.md`
                await updateFile(ctx, filePath, content)
            })
        )
    }

    async testAuth(auth: tt4b.backup.Auth, ext: tt4b.backup.TypeExt): Promise<string | undefined> {
        try {
            const { ctx, dirPath } = prepareContext(auth, ext)
            const result = await listAllFiles(ctx, dirPath)
            const { errorCode, message } = result || {}
            if (errorCode === NOT_FOUND_CODE) {
                // Empty directory will return this errCode
                return undefined
            } else if (errorCode === INVALID_AUTH_CODE) {
                return 'Your authorization token is invalid'
            }
            return message
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : e?.toString()
            const lowerErrMsg = errMsg?.toLocaleLowerCase?.()
            if (lowerErrMsg?.includes("failed to fetch")) {
                return "Unable to fetch this endpoint, please make sure it is accessible"
            } else if (lowerErrMsg?.includes("failed to parse url from")) {
                return "The endpoint is invalid, please check it"
            }
            return errMsg ?? e?.toString?.() ?? 'Unknown error'
        }
    }

    async clear({ auth, ext }: tt4b.backup.CoordinatorContext<never>, client: tt4b.backup.Client): Promise<void> {
        const cid = client.id
        const { ctx, dirPath } = prepareContext(auth, ext)
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