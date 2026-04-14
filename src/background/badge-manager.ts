/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { setBadgeBgColor, setBadgeText } from "@api/chrome/action"
import { listTabs } from "@api/chrome/tab"
import { getFocusedNormalWindowId, isNoneWindowId, onWindowFocusChanged } from "@api/chrome/window"
import { IS_ANDROID } from "@util/constant/environment"
import { extractHostname, isBrowserUrl } from "@util/pattern"
import { MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND } from "@util/time"
import statDatabase from "./database/stat-database"
import type MessageDispatcher from './message-dispatcher'
import optionHolder from "./service/components/option-holder"
import whitelistHolder from "./service/whitelist/holder"

type BadgeLocation = {
    /**
     * The tab id of badge text show display with
     */
    tabId: number
    /**
     * The url of tab
     */
    url: string
}

function mill2Str(milliseconds: number) {
    if (milliseconds < MILL_PER_MINUTE) {
        // no more than 1 minutes
        return `${Math.round(milliseconds / MILL_PER_SECOND)}s`
    } else if (milliseconds < MILL_PER_HOUR) {
        // no more than 1 hour
        return `${Math.round(milliseconds / MILL_PER_MINUTE)}m`
    } else {
        return `${(milliseconds / MILL_PER_HOUR).toFixed(1)}h`
    }
}

async function findActiveTab(windowId?: number): Promise<BadgeLocation | undefined> {
    windowId ??= await getFocusedNormalWindowId()
    if (isNoneWindowId(windowId)) return undefined
    const tabs = await listTabs({ windowId, active: true })
    // Fix #131 — Edge can return two active tabs (e.g. edge://newtab/).
    for (const { id: tabId, url } of tabs) {
        if (!tabId || !url || isBrowserUrl(url)) continue
        return { tabId, url }
    }
    return undefined
}

async function clearAllBadge(): Promise<void> {
    const tabs = await listTabs()
    if (!tabs?.length) return
    for (const { id } of tabs) id != null && await setBadgeText('', id)
}

class BadgeManager {
    private pausedTabId: number | undefined
    private current: BadgeLocation | undefined
    private visible = false

    async init(messageDispatcher: MessageDispatcher) {
        if (IS_ANDROID) return // do nothing on Android, since badge text is not supported

        const option = await optionHolder.get()
        await this.processOption(option)
        optionHolder.addChangeListener(opt => { void this.processOption(opt) })
        whitelistHolder.addPostHandler(() => { void this.render() })
        messageDispatcher.register('cs.idleChanged', (isIdle, sender) => {
            const tabId = sender?.tab?.id
            void (isIdle ? this.pause(tabId) : this.resume(tabId))
        })
        onWindowFocusChanged(async windowId => {
            const target = await findActiveTab(windowId)
            await this.updateFocus(target)
        })
        await this.updateFocus()
    }

    private async pause(tabId?: number) {
        if (typeof tabId !== 'number') return
        this.pausedTabId = tabId
        await this.render()
    }

    private async resume(tabId?: number) {
        if (typeof this.pausedTabId !== 'number') return
        if (typeof tabId !== 'number' || this.pausedTabId !== tabId) return
        this.pausedTabId = undefined
        await this.render()
    }

    async updateFocus(target?: BadgeLocation) {
        this.current = target ?? await findActiveTab()
        await this.render()
    }

    private async processOption(option: timer.option.AppearanceOption) {
        const { displayBadgeText, badgeBgColor } = option ?? {}
        const before = this.visible
        this.visible = !!displayBadgeText
        if (!this.visible && before) await clearAllBadge()
        await setBadgeBgColor(badgeBgColor)
        if (before !== this.visible) await this.render()
    }

    private async render(): Promise<void> {
        const badgeText = await this.resolveBadgeText()
        await setBadgeText(badgeText, this.current?.tabId)
    }

    private async resolveBadgeText(): Promise<string> {
        if (!this.current || !this.visible) return ''
        const { url, tabId } = this.current
        if (isBrowserUrl(url)) return '∅'
        const { host } = extractHostname(url)
        if (whitelistHolder.contains(host, url)) return 'W'
        if (this.pausedTabId === tabId) return 'P'
        const { focus } = await statDatabase.get(host, new Date())
        return mill2Str(focus)
    }
}

const badgeTextManager = new BadgeManager()

export default badgeTextManager
