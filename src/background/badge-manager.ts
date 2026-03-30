/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { setBadgeBgColor, setBadgeText } from "@api/chrome/action"
import { listTabs } from "@api/chrome/tab"
import { getFocusedNormalWindowId } from "@api/chrome/window"
import { IS_ANDROID } from "@util/constant/environment"
import { extractHostname, isBrowserUrl } from "@util/pattern"
import { MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND } from "@util/time"
import statDatabase from "./database/stat-database"
import type MessageDispatcher from './message-dispatcher'
import optionHolder from "./service/components/option-holder"
import whitelistHolder from "./service/whitelist/holder"

export type BadgeLocation = {
    /**
     * The tab id of badge text show display with
     */
    tabId: number
    /**
     * The url of tab
     */
    url: string
    focus?: number
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

async function findActiveTab(): Promise<BadgeLocation | undefined> {
    const windowId = await getFocusedNormalWindowId()
    if (!windowId) {
        return undefined
    }
    const tabs = await listTabs({ active: true, windowId })
    // Fix #131
    // Edge will return two active tabs, including the new tab with url 'edge://newtab/', GG
    for (const { id: tabId, url } of tabs) {
        if (!tabId || !url || isBrowserUrl(url)) continue
        return { tabId, url }
    }
    return undefined
}

async function clearAllBadge(): Promise<void> {
    const tabs = await listTabs()
    if (!tabs?.length) return
    for (const tab of tabs) {
        await setBadgeText('', tab?.id)
    }
}

type BadgeState = 'HIDDEN' | 'NOT_SUPPORTED' | 'PAUSED' | 'TIME' | 'WHITELIST'

interface BadgeManager {
    init(dispatcher: MessageDispatcher): void
    updateFocus(location?: BadgeLocation): void
}

class DefaultBadgeManager {
    pausedTabId: number | undefined
    current: BadgeLocation | undefined
    visible: boolean | undefined
    state: BadgeState | undefined

    async init(messageDispatcher: MessageDispatcher) {
        const option = await optionHolder.get()
        this.processOption(option)
        optionHolder.addChangeListener(opt => this.processOption(opt))
        whitelistHolder.addPostHandler(() => this.render())
        messageDispatcher
            .register('cs.idleChange', (isIdle, sender) => {
                const tabId = sender?.tab?.id
                isIdle ? this.pause(tabId) : this.resume(tabId)
            })
        this.updateFocus()
    }

    /**
     * Hide the badge text
     */
    private async pause(tabId?: number) {
        this.pausedTabId = tabId
        this.render()
    }

    /**
     * Show the badge text
     */
    private resume(tabId?: number) {
        if (!this.pausedTabId || this.pausedTabId !== tabId) return
        this.pausedTabId = undefined
        this.render()
    }

    async updateFocus(target?: BadgeLocation) {
        this.current = target || await findActiveTab()
        await this.render()
    }

    private processOption(option: timer.option.AppearanceOption) {
        const { displayBadgeText, badgeBgColor } = option || {}
        const before = this.visible
        this.visible = !!displayBadgeText
        !this.visible && before && clearAllBadge()
        setBadgeBgColor(badgeBgColor)
    }

    private async render(): Promise<void> {
        const [nextState, badgeText] = await this.processState()
        if (this.state !== nextState) {
            this.state = nextState
            setBadgeText(badgeText, this.current?.tabId)
        }
    }

    private async processState(): Promise<[BadgeState, text: string]> {
        const { url, tabId, focus } = this.current ?? {}
        if (!this.visible || !url) return ['HIDDEN', '']
        if (isBrowserUrl(url)) return ['NOT_SUPPORTED', '∅']
        const { host } = extractHostname(url)
        if (whitelistHolder.contains(host, url)) return ['WHITELIST', 'W']
        if (this.pausedTabId === tabId) return ['PAUSED', 'P']
        const milliseconds = focus ?? (await statDatabase.get(host, new Date())).focus
        const millText = mill2Str(milliseconds)
        return ['TIME', millText]
    }
}

class SilentBadgeManager implements BadgeManager {
    init(): void {
        // do nothing
    }
    updateFocus(_location?: BadgeLocation): void {
        // do nothing
    }
}

// Don't display badge on Android
const badgeManager: BadgeManager = IS_ANDROID ? new SilentBadgeManager() : new DefaultBadgeManager()

export default badgeManager
