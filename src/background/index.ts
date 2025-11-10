/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listTabs, trySendMsg2Tab } from "@api/chrome/tab"
import { isNoneWindowId, onNormalWindowFocusChanged } from "@api/chrome/window"
import optionHolder from "@service/components/option-holder"
import { isBrowserUrl } from "@util/pattern"
import { openLog } from "../common/logger"
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
import TabListener from './tab-listener'
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

// Listen to tab changed
new TabListener()
    .onActivated(({ url, tabId }) => badgeTextManager.updateFocus({ url, tabId }))
    .onUpdated((tabId, { audible }) => audible !== undefined && trySendMsg2Tab(tabId, 'syncAudible', audible))
    .start()

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
        badgeTextManager.updateFocus({ url, tabId })
    })
})

// listen permission change event
optionHolder.listenPermChange()