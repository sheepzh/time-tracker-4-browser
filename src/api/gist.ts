/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import FIFOCache from "@util/fifo-cache"
import { fetchGet, fetchGetWithTry, fetchPost } from "./http"

type BaseFile = {
    filename: string
}

export type FileForm = BaseFile & {
    content: string
}

export type File = BaseFile & {
    type: string
    language: string
    raw_url: string
    content?: string
}

type BaseGist<FileInfo> = {
    public: boolean
    description: string
    files: { [filename: string]: FileInfo | null }
}

export type Gist = BaseGist<File> & {
    id: string
}

export type GistForm = BaseGist<FileForm>

const BASE_URL = 'https://api.github.com/gists'

/**
 * Cache of get requests
 */
const GET_CACHE = new FIFOCache<unknown>(20)

async function get<T>(token: string, uri: string): Promise<T> {
    const cacheKey = uri + token
    return await GET_CACHE.getOrSupply(cacheKey, async () => {
        const headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": `token ${token}`
        }
        const url = BASE_URL + uri
        const response = await fetchGet(url, { headers })
        return await response.json()
    }) as T
}

async function post<T, R>(token: string, uri: string, body?: R): Promise<T> {
    const response = await fetchPost<R>(BASE_URL + uri, body, {
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `token ${token}`
        }
    })
    const result = await response.json()
    const { status } = response
    if (status >= 200 && status < 300) {
        // Clear cache if success to request
        GET_CACHE.clear()
        return result as T
    }
    throw new Error(JSON.stringify(result))
}

/**
 * @param token token
 * @param id    id
 * @returns detail of Gist
 */
export function getGist(token: string, id: string): Promise<Gist> {
    return get(token, `/${id}`)
}

/**
 * Find the first target gist with predicate
 *
 * @param token     gist token
 * @param predicate predicate
 * @returns
 */
export async function findTarget(token: string, predicate: (gist: Gist) => boolean): Promise<Gist | null> {
    let pageNum = 1
    while (true) {
        const uri = `?per_page=100&page=${pageNum}`
        const gists: Gist[] = await get(token, uri)
        if (!gists?.length) {
            break
        }
        const satisfied = gists.find(predicate)
        if (satisfied) {
            return satisfied
        }
        pageNum += 1
    }
    return null
}

/**
 * Create one gist
 *
 * @param token  token
 * @param gist   gist info
 * @returns gist info with id
 */
export function createGist(token: string, gist: GistForm): Promise<Gist> {
    return post(token, "", gist)
}

/**
 * Update gist
 *
 * @param token token
 * @param gist  gist
 * @returns
 */
export async function updateGist(token: string, id: string, gist: GistForm): Promise<void> {
    await post(token, `/${id}`, gist)
}

/**
 * Get content of file
 */
export async function getJsonFileContent<T>(file: File): Promise<T | null> {
    const content = file.content
    if (content) {
        try {
            return JSON.parse(content)
        } catch (e) {
            console.warn("Failed to parse content of: " + file.raw_url)
            console.warn(e)
        }
    }
    const rawUrl = file.raw_url
    if (!rawUrl) {
        return null
    }
    const response = await fetchGetWithTry(rawUrl, 3)
    return await response.json()
}

/**
 * Test token to process gist
 *
 * @returns errorMsg or null/undefined
 */
export async function testToken(token: string): Promise<string | undefined> {
    const response = await fetchGet(BASE_URL + '?per_page=1&page=1', {
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `token ${token}`
        }
    })
    const { status, statusText } = response || {}
    return status === 200 ? undefined : statusText || ("ERROR " + status)
}
