/**
 * Copyright (c) 2023 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { fetchDelete, fetchGet, fetchPutText } from "./http"

export const DEFAULT_ENDPOINT = "http://127.0.0.1:27123"
export const DEFAULT_VAULT = "vault"
export const INVALID_AUTH_CODE = 40101
export const NOT_FOUND_CODE = 40400

export type ObsidianResult<T> = {
    message?: string
    errorCode?: number
} & T

export type ObsidianRequestContext = {
    endpoint?: string
    vault?: string
    auth: string
}

const authHeaders = (auth: string): Record<string, string> => ({
    "Authorization": `Bearer ${auth}`
})

export async function listAllFiles(context: ObsidianRequestContext, dirPath: string): Promise<ObsidianResult<{ files: string[] }>> {
    const { endpoint, auth, vault } = context || {}
    const url = `${endpoint || DEFAULT_ENDPOINT}/${vault || DEFAULT_VAULT}/${dirPath || ''}`
    const response = await fetchGet(url, { headers: authHeaders(auth) })
    return await response?.json()
}

export async function updateFile(context: ObsidianRequestContext, filePath: string, content: string): Promise<void> {
    const { endpoint, auth, vault } = context || {}
    const url = `${endpoint || DEFAULT_ENDPOINT}/${vault || DEFAULT_VAULT}/${filePath}`
    const headers = authHeaders(auth)
    headers["Content-Type"] = "text/markdown"
    await fetchPutText(url, content, { headers })
}

export async function getFileContent(context: ObsidianRequestContext, filePath: string): Promise<string | null> {
    const { endpoint, auth, vault } = context || {}
    const url = `${endpoint || DEFAULT_ENDPOINT}/${vault || DEFAULT_VAULT}/${filePath}`
    const headers = authHeaders(auth)
    const response = await fetchGet(url, { headers })
    const { status } = response
    return status >= 200 && status < 300 ? await response.text() : null
}

export async function deleteFile(context: ObsidianRequestContext, filePath: string): Promise<void> {
    const { endpoint, auth, vault } = context || {}
    const url = `${endpoint || DEFAULT_ENDPOINT}/${vault || DEFAULT_VAULT}/${filePath}`
    const headers = authHeaders(auth)
    const response = await fetchDelete(url, { headers })
    if (response.status !== 200) {
        console.log(`Failed to delete file of Obsidian. filePath=${filePath}`)
    }
}