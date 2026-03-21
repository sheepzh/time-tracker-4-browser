import { IS_MV3 } from "@util/constant/environment"
import { handleError } from "./common"

export async function listAllGroups(): Promise<chrome.tabGroups.TabGroup[]> {
    if (!chrome.tabGroups) return []
    if (IS_MV3) {
        try {
            return chrome.tabGroups.query({})
        } catch (e) {
            return []
        }
    } else {
        return new Promise(resolve => {
            chrome.tabGroups.query({}, arr => {
                handleError('listAllGroups')
                resolve(arr ?? [])
            })
        })
    }
}

export async function getGroup(id: number | undefined): Promise<chrome.tabGroups.TabGroup | undefined> {
    if (!id) return undefined
    if (!chrome.tabGroups) return undefined
    try {
        if (IS_MV3) {
            const group = await chrome.tabGroups.get(id)
            return group
        } else {
            return new Promise(resolve => chrome.tabGroups.get(id, g => {
                handleError('getGroup')
                resolve(g)
            }))
        }
    } catch (e) {
        return undefined
    }
}

export function onChanged(handler: ArgCallback<chrome.tabGroups.TabGroup>): void {
    try {
        if (!chrome.tabGroups) return
        chrome.tabGroups.onCreated.addListener(handler)
        chrome.tabGroups.onRemoved.addListener(handler)
        chrome.tabGroups.onUpdated.addListener(handler)
    } catch (e) {
        // ignored
    }
}

export function removeChangedHandler(handler: ArgCallback<chrome.tabGroups.TabGroup>): void {
    try {
        if (!chrome.tabGroups) return
        chrome.tabGroups.onCreated.removeListener(handler)
        chrome.tabGroups.onRemoved.removeListener(handler)
        chrome.tabGroups.onUpdated.removeListener(handler)
    } catch (e) {
        // ignored
    }
}

export function isValidGroup(groupId?: number): groupId is number {
    if (!groupId) return false
    try {
        return !!groupId && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
    } catch {
        return false
    }
}

export const cvtGroupColor = (color?: `${chrome.tabGroups.Color}`): string => {
    switch (color) {
        case 'grey': return '#5F6369'
        case 'blue': return '#1974E8'
        case 'yellow': return '#F9AB03'
        case 'red': return '#DA3025'
        case 'green': return '#198139'
        case 'pink': return '#D01984'
        case 'purple': return '#A143F5'
        case 'cyan': return '#027B84'
        case 'orange': return '#FA913E'
        default: return '#000'
    }
}
