/**
* Copyright (c) 2022-present Hengyang Zhang
*
* This software is released under the MIT License.
* https://opensource.org/licenses/MIT
*/

import { createArrayGuard, createObjectGuard, isInt, isString, TypeGuard } from 'typescript-guard'
import { CROWDIN_PROJECT_ID } from "../util/constant/url"

type ListResponse<T> = {
    data: { data: T }[]
}

const createListRespGuard = <T,>(itemGuard: TypeGuard<T>) => createObjectGuard<ListResponse<T>>({
    data: createArrayGuard(createObjectGuard({ data: itemGuard }))
})

/**
 * Used to obtain translation status
 */
const PUBLIC_TOKEN = '5e0d53accb6e8c490a1af2914c0963f78082221d7bc1dcb0d56b8e3856a875e432a2e353a948688e'

export type TranslationStatusInfo = {
    /**
    * https://developer.crowdin.com/language-codes/
    */
    languageId: string
    translationProgress: number
}

const isStatusResp = createListRespGuard(
    createObjectGuard<TranslationStatusInfo>({
        languageId: isString,
        translationProgress: isInt,
    })
)

type MemberInfo = {
    username: string
    joinedAt: string
    avatarUrl: string
}

const isMembersResp = createListRespGuard(
    createObjectGuard<MemberInfo>({
        username: isString,
        joinedAt: isString,
        avatarUrl: isString,
    })
)

export async function getTranslationStatus(): Promise<TranslationStatusInfo[]> {
    const limit = 500
    const url = `https://api.crowdin.com/api/v2/projects/${CROWDIN_PROJECT_ID}/languages/progress?limit=${limit}`
    return await getList(url, isStatusResp)
}

export async function getMembers(): Promise<MemberInfo[]> {
    const result: MemberInfo[] = []
    const limit = 10
    let offset = 0
    while (true) {
        const url = `https://api.crowdin.com/api/v2/projects/${CROWDIN_PROJECT_ID}/members?limit=${limit}&offset=${offset}`
        const newItems = await getList(url, isMembersResp)
        result.push(...newItems)
        if (newItems.length < limit) break

        offset += limit
    }
    return result
}

async function getList<T>(url: string, respGuard: TypeGuard<ListResponse<T>>): Promise<T[]> {
    const resp = await fetch(url, {
        method: 'GET',
        headers: { "Authorization": `Bearer ${PUBLIC_TOKEN}` },
    })
    const json = await resp.json()
    if (respGuard(json)) return json.data.map(i => i.data)
    console.warn('Unexpected response from Crowdin API', json)
    return []
}
