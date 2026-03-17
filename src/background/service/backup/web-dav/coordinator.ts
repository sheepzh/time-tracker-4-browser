import {
    deleteDir, judgeDirExist, makeDirs, readFile, writeFile,
    type WebDAVAuth, type WebDAVContext,
} from "@api/web-dav"
import DateIterator from "@util/date-iterator"
import { processDir } from "../common"
import { CLIENT_FILE_NAME, convertClients2Markdown, divideByDate, parseData } from "../markdown"

function getEndpoint(ext: timer.backup.TypeExt | undefined): string | undefined {
    let { endpoint } = ext || {}
    if (endpoint?.endsWith('/')) {
        endpoint = endpoint.substring(0, endpoint.length - 1)
    }
    return endpoint
}

function prepareContext(context: timer.backup.CoordinatorContext<never>): WebDAVContext {
    const { auth, ext } = context
    const endpoint = getEndpoint(ext)
    if (!endpoint) {
        throw new Error('Endpoint must be empty. This can\'t happen, please contact the developer')
    }
    const { acc: username, psw: password } = auth?.login || {}
    if (!username || !password) {
        throw new Error('Neither username nor password must be empty. This can\'t happen, please contact the developer')
    }
    const webDavAuth: WebDAVAuth = { type: "password", username, password }
    return { auth: webDavAuth, endpoint }
}

export default class WebDAVCoordinator implements timer.backup.Coordinator<never> {
    async updateClients(context: timer.backup.CoordinatorContext<never>, clients: timer.backup.Client[]): Promise<void> {
        const dirPath = processDir(context?.ext?.dirPath)
        const clientFilePath = `${dirPath}${CLIENT_FILE_NAME}`
        const content = convertClients2Markdown(clients)
        const davContext = prepareContext(context)
        await writeFile(davContext, clientFilePath, content)
    }

    async listAllClients(context: timer.backup.CoordinatorContext<never>): Promise<timer.backup.Client[]> {
        const dirPath = processDir(context?.ext?.dirPath)
        const clientFilePath = `${dirPath}${CLIENT_FILE_NAME}`
        const davContext = prepareContext(context)
        try {
            const content = await readFile(davContext, clientFilePath)
            return parseData(content) ?? []
        } catch (e) {
            console.warn("Failed to read WebDav file content", e)
            return []
        }
    }

    async download(context: timer.backup.CoordinatorContext<never>, dateStart: Date, dateEnd: Date, targetCid?: string): Promise<timer.core.Row[]> {
        const dirPath = processDir(context?.ext?.dirPath)
        const davContext = prepareContext(context)
        targetCid = targetCid || context?.cid

        const dateIterator = new DateIterator(dateStart, dateEnd)
        const result: timer.core.Row[] = []
        await Promise.all(dateIterator.toArray().map(async date => {
            const filePath = `${dirPath}${targetCid}/${date}.md`
            const fileContent = await readFile(davContext, filePath)
            const rows = parseData<timer.core.Row[]>(fileContent)
            rows?.forEach?.(row => result.push(row))
        }))
        return result
    }

    async upload(context: timer.backup.CoordinatorContext<never>, rows: timer.core.Row[]): Promise<void> {
        const dateAndContents = divideByDate(rows)
        const dirPath = processDir(context?.ext?.dirPath)
        const cid = context?.cid
        const davContext = prepareContext(context)

        const clientPath = await this.checkClientDirExist(davContext, dirPath, cid)

        await Promise.all(
            Object.entries(dateAndContents).map(async ([date, content]) => {
                const filePath = `${clientPath}/${date}.md`
                await writeFile(davContext, filePath, content)
            })
        )
    }

    private async checkClientDirExist(davContext: WebDAVContext, dirPath: string, cid: string) {
        const clientDirPath = `${dirPath}${cid}`
        await makeDirs(davContext, clientDirPath)
        return clientDirPath
    }

    async testAuth(auth: timer.backup.Auth, ext: timer.backup.TypeExt): Promise<string | undefined> {
        const endpoint = getEndpoint(ext)
        if (!endpoint) {
            return "The endpoint is blank"
        }
        const { dirPath } = ext || {}
        if (!dirPath) {
            return "The path of directory is blank"
        }
        const { acc, psw } = auth?.login || {}
        if (!acc) {
            return 'Account is blank'
        }
        if (!psw) {
            return 'Password is blank'
        }
        const davAuth: WebDAVAuth = { type: 'password', username: acc, password: psw }
        const davContext: WebDAVContext = { endpoint, auth: davAuth }
        const webDavPath = processDir(dirPath)
        try {
            await makeDirs(davContext, webDavPath)
            const exist = await judgeDirExist(davContext, webDavPath)
            if (!exist) {
                return "Failed to create directory"
            }
        } catch (e) {
            return (e as Error)?.message ?? e?.toString?.() ?? 'Unknown error'
        }
    }

    async clear(context: timer.backup.CoordinatorContext<never>, client: timer.backup.Client): Promise<void> {
        const cid = client.id
        const dirPath = processDir(context.ext?.dirPath)
        const davContext = prepareContext(context)
        const clientDirPath = `${dirPath}${cid}/`
        const exist = await judgeDirExist(davContext, clientDirPath)

        if (!exist) return
        await deleteDir(davContext, clientDirPath)
    }
}