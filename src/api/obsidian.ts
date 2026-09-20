/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { fetchDelete, fetchGet, fetchPutText } from "./http"

export const OBSIDIAN_DEFAULTS = { endpoint: "http://127.0.0.1:27123", vault: "vault" } as const

type ObsidianResult<T> = {
    message?: string
    errorCode?: number
} & T

export type ObsidianRequestContext = {
    endpoint: string
    vault: string
    auth: string
}

const authHeaders = (auth: string): Record<string, string> => ({
    "Authorization": `Bearer ${auth}`
})

const url = ({ endpoint, vault }: ObsidianRequestContext, path: string) => {
    return `${endpoint}/${vault}/${path}`
}

export async function listAllFiles(context: ObsidianRequestContext, dirPath: string): Promise<ObsidianResult<{ files: string[] }>> {
    const response = await fetchGet(url(context, dirPath), { headers: authHeaders(context.auth) })
    return await response?.json()
}

export async function updateFile(context: ObsidianRequestContext, filePath: string, content: string): Promise<void> {
    const headers = authHeaders(context.auth)
    headers["Content-Type"] = "text/markdown"
    await fetchPutText(url(context, filePath), content, { headers })
}

export async function getFileContent(context: ObsidianRequestContext, filePath: string): Promise<string | null> {
    const response = await fetchGet(url(context, filePath), { headers: authHeaders(context.auth) })
    const { status } = response
    return status >= 200 && status < 300 ? await response.text() : null
}

export async function deleteFile(context: ObsidianRequestContext, filePath: string): Promise<void> {
    const response = await fetchDelete(url(context, filePath), { headers: authHeaders(context.auth) })
    if (response.status !== 200) {
        console.log(`Failed to delete file of Obsidian. filePath=${filePath}`)
    }
}