/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listTabs } from "@api/chrome/tab"
import { isNoneWindowId, onNormalWindowFocusChanged } from "@api/chrome/window"
import optionHolder from "@service/components/option-holder"
import itemService from "@service/item-service"
import whitelistHolder from "@service/whitelist/holder"
import { isBrowserUrl } from "@util/pattern"
import { openLog } from "../common/logger"
import ActiveTabListener from "./active-tab-listener"
import AudioTabListener from "./audio-tab-listener"
import BackupScheduler from "./backup-scheduler"
import badgeTextManager from "./badge-manager"
import initBrowserAction from "./browser-action-manager"
import initCsHandler from "./content-script-handler"
import initDataCleaner from "./data-cleaner"
import handleInstall from "./install-handler"
import initLimitProcessor from "./limit-processor"
import MessageDispatcher from "./message-dispatcher"
import VersionMigrator from "./migrator"
import initSidePanel from "./side-panel"
import initTrackServer from "./track-server"
import initWhitelistMenuManager from "./whitelist-menu-manager"

// Open the log of console
openLog()

// Init side panel
initSidePanel()

// Init browser action
initBrowserAction()

// Init data cleaner
initDataCleaner()

const messageDispatcher = new MessageDispatcher()

// Limit processor
initLimitProcessor(messageDispatcher)

// Content-script's request handler
initCsHandler(messageDispatcher)

// Start server
initTrackServer(messageDispatcher)

// Process version
new VersionMigrator().init()

// Backup scheduler
new BackupScheduler().init()

// Manage the context menus
initWhitelistMenuManager()

// Badge manager
badgeTextManager.init(messageDispatcher)

// Track the currently active tab
let activeTabId: number | null = null
const audioTabListener = new AudioTabListener()

// Listen to tab active changed
new ActiveTabListener()
    .register(({ url, tabId }) => {
        activeTabId = tabId
        audioTabListener.onActiveTabChanged(tabId)
        badgeTextManager.updateFocus({ url, tabId })
    })
    .listen()

// Listen to audio playback in background tabs
audioTabListener
    .register(async ({ host, url, duration, tabId }) => {
        if (whitelistHolder.contains(host, url)) return

        const focusTimeMs = duration * 1000
        await itemService.addFocusTime({ host, url }, focusTimeMs)

        badgeTextManager.updateFocus({ url, tabId })
    })
    .listen(() => activeTabId)

handleInstall()

// Start message dispatcher
messageDispatcher.start()

// Listen window focus changed
onNormalWindowFocusChanged(async windowId => {
    if (isNoneWindowId(windowId)) return
    const tabs = await listTabs({ windowId, active: true })
    tabs.forEach(tab => {
        const { url, id: tabId } = tab
        if (!url || isBrowserUrl(url) || !tabId) return
        activeTabId = tabId
        audioTabListener.onActiveTabChanged(tabId)
        badgeTextManager.updateFocus({ url, tabId })
    })
})

// listen permission change event
optionHolder.listenPermChange()