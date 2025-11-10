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
    lastCheckTime: number
    isCurrentlyActive: boolean
}

type AudioEventParam = {
    url: string
    tabId: number
    host: string
    duration: number // seconds of audio playback
}

type AudioEventHandler = (params: AudioEventParam) => void

const STORAGE_KEY = 'audioPlayingTabsState'
const PERSIST_INTERVAL_MS = 5000  // Save state every 5 seconds

export default class AudioTabListener {
    private listeners: AudioEventHandler[] = []
    private audioPlayingTabs: Map<number, AudioState> = new Map()
    private persistenceInterval: number | null = null

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

    private async restoreState() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEY)
            const stateArray = result[STORAGE_KEY]
            if (stateArray && Array.isArray(stateArray)) {
                this.audioPlayingTabs = new Map(stateArray)
            }
        } catch (e) {
            // Ignore errors - state will start fresh
            console.warn('Failed to restore audio tracking state:', e)
        }
    }

    private async saveState() {
        // Don't save if no tabs are playing audio
        if (this.audioPlayingTabs.size === 0) return

        try {
            const stateArray = Array.from(this.audioPlayingTabs.entries())
            await chrome.storage.local.set({ [STORAGE_KEY]: stateArray })
        } catch (e) {
            // Ignore errors - will retry on next interval
            console.warn('Failed to save audio tracking state:', e)
        }
    }

    private startPersistence() {
        // Persist state periodically to survive service worker restarts (Chrome/Edge)
        this.persistenceInterval = setInterval(() => {
            this.saveState()
        }, PERSIST_INTERVAL_MS) as unknown as number
    }

    private stopPersistence() {
        if (this.persistenceInterval !== null) {
            clearInterval(this.persistenceInterval)
            this.persistenceInterval = null
        }
    }

    async listen(getActiveTabId: () => number | null) {
        // Restore state on startup (handles Chrome service worker restarts)
        await this.restoreState()

        // Start periodic persistence
        this.startPersistence()

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

    onActiveTabChanged(newActiveTabId: number | null) {
        this.audioPlayingTabs.forEach((state, tabId) => {
            const isNowActive = tabId === newActiveTabId
            this.handleTabActivationChange(tabId, isNowActive)
        })
    }
}