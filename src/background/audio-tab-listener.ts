/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { onTabRemoved, onTabUpdated } from "@api/chrome/tab"
import { extractHostname, type HostInfo } from "@util/pattern"

type AudioState = {
    host: string
    url: string
    tabId: number
    lastCheckTime: number  // Track when we last checked/updated
    isCurrentlyActive: boolean  // Current active state
}

type AudioEventParam = {
    url: string
    tabId: number
    host: string
    duration: number // seconds of audio playback
}

type AudioEventHandler = (params: AudioEventParam) => void

export default class AudioTabListener {
    private listeners: AudioEventHandler[] = []
    private audioPlayingTabs: Map<number, AudioState> = new Map()

    register(handler: AudioEventHandler): AudioTabListener {
        this.listeners.push(handler)
        return this
    }

    private notifyListeners(param: AudioEventParam) {
        this.listeners.forEach(func => func(param))
    }

    private handleAudioStart(tabId: number, url: string, isActiveTab: boolean) {
        if (!url) return

        const hostInfo: HostInfo = extractHostname(url)
        const host: string = hostInfo.host

        const existingState = this.audioPlayingTabs.get(tabId)

        if (existingState && existingState.url === url) {
            return
        }

        this.audioPlayingTabs.set(tabId, {
            host,
            url,
            tabId,
            lastCheckTime: Date.now(),
            isCurrentlyActive: isActiveTab
        })
    }

    private handleAudioStop(tabId: number) {
        const state = this.audioPlayingTabs.get(tabId)
        if (!state) return

        // Record any remaining time before stopping
        this.recordSegment(state)

        this.audioPlayingTabs.delete(tabId)
    }

    private recordSegment(state: AudioState) {
        const now = Date.now()
        const duration = Math.floor((now - state.lastCheckTime) / 1000)

        // Only record if tab was INACTIVE during this segment
        if (duration > 0 && !state.isCurrentlyActive) {
            this.notifyListeners({
                url: state.url,
                tabId: state.tabId,
                host: state.host,
                duration
            })
        }

        // Reset check time for next segment
        state.lastCheckTime = now
    }

    private handleTabActivationChange(tabId: number, isNowActive: boolean) {
        const state = this.audioPlayingTabs.get(tabId)
        if (!state) return

        // If state changed, record the previous segment
        if (state.isCurrentlyActive !== isNowActive) {
            this.recordSegment(state)
            state.isCurrentlyActive = isNowActive
        }
    }

    listen(getActiveTabId: () => number | null) {

        onTabUpdated((tabId, changeInfo, tab) => {
            if (changeInfo.audible !== undefined) {
                if (changeInfo.audible && tab?.url) {
                    const activeTabId = getActiveTabId()
                    const isActive = tabId === activeTabId
                    this.handleAudioStart(tabId, tab.url, isActive)
                } else {
                    this.handleAudioStop(tabId)
                }
            }
        })

        onTabRemoved(tabId => {
            this.handleAudioStop(tabId)
        })
    }

    // Call this when active tab changes
    onActiveTabChanged(newActiveTabId: number | null) {
        // Check all currently playing audio tabs
        this.audioPlayingTabs.forEach((state, tabId) => {
            const isNowActive = tabId === newActiveTabId
            this.handleTabActivationChange(tabId, isNowActive)
        })
    }
}