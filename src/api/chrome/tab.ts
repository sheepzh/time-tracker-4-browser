/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { handleError } from "./common"

class ActivatedTabCtx {
    lastTabId?: number
    listened: boolean = false

    async apply(): Promise<number | undefined> {
        if (this.listened) {
            return this.lastTabId
        }

        // init
        chrome.tabs.onActivated.addListener(activeInfo => {
            this.lastTabId = activeInfo.tabId
        })
        this.listened = true

        return this.getInner()
    }

    private getInner(): Promise<number | undefined> {
        return new Promise(resolve => chrome.tabs.query(
            { active: true },
            tabs => {
                handleError('getActivatedTab')
                const activeTab = tabs?.[0]
                resolve(activeTab?.id)
            }
        ))
    }
}

const ACTIVATED_TAB_CTX = new ActivatedTabCtx()

export function lastActivatedTabId(): Promise<number | undefined> {
    return ACTIVATED_TAB_CTX.apply()
}

export function getTab(id: number): Promise<ChromeTab | undefined> {
    if (id < 0) {
        return Promise.resolve(undefined)
    }
    return new Promise(resolve => chrome.tabs.get(id, tab => {
        handleError("getTab")
        resolve(tab)
    }))
}

export function resetTabUrl(tabId: number, url: string): Promise<void> {
    return new Promise(resolve => chrome.tabs.update(tabId, {
        url: url,
        highlighted: true,
    }, () => resolve()))
}

export async function getRightOf(target: ChromeTab): Promise<ChromeTab | undefined> {
    if (!target) return
    const { windowId, index } = target
    return new Promise(resolve => chrome.tabs.query({ windowId }, tabs => {
        const rightTab = tabs
            ?.sort?.((a, b) => (a?.index ?? -1) - (b?.index ?? -1))
            ?.filter?.(t => t.index > index)
            ?.[0]
        resolve(rightTab)
    }))
}

export function getCurrentTab(): Promise<ChromeTab | undefined> {
    return new Promise(resolve => chrome.tabs.getCurrent(tab => {
        handleError("getCurrentTab")
        resolve(tab)
    }))
}

export function createTab(param: chrome.tabs.CreateProperties | string): Promise<ChromeTab> {
    const prop: chrome.tabs.CreateProperties = typeof param === 'string' ? { url: param } : param
    return new Promise(resolve => chrome.tabs.create(prop, tab => {
        handleError("getTab")
        resolve(tab)
    }))
}

/**
 * Create one tab after current tab.
 *
 * Must not be invoked in background.js
 */
export async function createTabAfterCurrent(url: string, currentTab?: ChromeTab): Promise<ChromeTab> {
    if (!currentTab) {
        currentTab = await getCurrentTab()
    }
    if (!currentTab) {
        // Current tab not found
        return createTab(url)
    } else {
        const { windowId, index: currentIndex } = currentTab
        return createTab({
            url,
            windowId,
            index: (currentIndex ?? -1) + 1
        })
    }
}

export function listTabs(query?: chrome.tabs.QueryInfo): Promise<ChromeTab[]> {
    query = query || {}
    return new Promise(resolve => chrome.tabs.query(query, tabs => {
        handleError("listTabs")
        resolve(tabs || [])
    }))
}

export function sendMsg2Tab<T = any, R = any>(tabId: number, code: timer.mq.ReqCode, data?: T): Promise<R> {
    const request: timer.mq.Request<T> = { code, data }
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject('sendMsg2Tab timeout'), 2000)
        chrome.tabs.sendMessage<timer.mq.Request<T>, timer.mq.Response>(tabId, request, response => {
            const sendError = handleError('sendMsg2Tab')
            clearTimeout(timeout)
            const resCode = response?.code
            resCode === 'success' && resolve(response.data)
            reject(new Error(response?.msg ?? sendError ?? 'Unknown error'))
        })
    })
}

export async function trySendMsg2Tab<T = any, R = any>(
    tabId: number,
    code: timer.mq.ReqCode,
    data?: T
): Promise<R | undefined> {
    try {
        return await sendMsg2Tab<T, R>(tabId, code, data)
    } catch (e) {
        console.warn(`Errored to send message to tab: tabId=${tabId}, code=${code}, data=${JSON.stringify(data)}`, e)
        return Promise.resolve(undefined)
    }
}

type TabHandler<Event> = (tabId: number, ev: Event, tab: ChromeTab) => void

export function onTabActivated(handler: (tabId: number, info: ChromeTabActiveInfo) => void): void {
    chrome.tabs.onActivated.addListener(activeInfo => {
        handleError("tabActivated")
        handler(activeInfo.tabId, activeInfo)
    })
}

export function onTabUpdated(handler: TabHandler<ChromeTabUpdatedInfo>): void {
    chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: ChromeTabUpdatedInfo, tab: ChromeTab) => {
        handleError("tabUpdated")
        handler(tabId, changeInfo, tab)
    })
}