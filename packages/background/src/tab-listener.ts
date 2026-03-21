/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getTab, onTabActivated, onTabUpdated } from "@api/chrome/tab"

type TabProfile = {
    url: string
    tabId: number
}

type UpdatedHandler = (tabId: number, info: ChromeTabUpdatedInfo, tab: ChromeTab) => void

export default class TabListener {
    activatedHandlers: ArgCallback<{ url: string, tabId: number }>[] = []
    updatedHandlers: UpdatedHandler[] = []

    private async processActivated(tab: ChromeTab) {
        const { url, id: tabId } = tab
        if (!url || !tabId) return
        const tabProf: TabProfile = { url, tabId }
        this.activatedHandlers.forEach(func => func(tabProf))
    }

    onActivated(handler: ArgCallback<TabProfile>): TabListener {
        this.activatedHandlers.push(handler)
        return this
    }

    onUpdated(handler: UpdatedHandler): TabListener {
        this.updatedHandlers.push(handler)
        return this
    }

    start() {
        onTabActivated(async tabId => {
            const tab = await getTab(tabId)
            tab && this.processActivated(tab)
        })

        onTabUpdated(async (tabId, changeInfo, tab) => {
            this.updatedHandlers.forEach(func => func(tabId, changeInfo, tab))
        })
    }
}

