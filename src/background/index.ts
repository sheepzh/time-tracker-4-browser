/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { trySendMsg2Tab } from "@api/chrome/tab"
import badgeTextManager from "./badge-manager"
import initCsHandler from "./content-script-handler"
import initDataCleaner from "./data-cleaner"
import { initAfterInstalled } from './install-handler'
import initLimitProcessor from "./limit-processor"
import MessageDispatcher from "./message-dispatcher"
import { initScheduler } from './scheduler'
import TabListener from './tab-listener'
import initTrackServer from "./track-server"
import initWhitelistMenuManager from "./whitelist-menu-manager"

initAfterInstalled()

// Init data cleaner
initDataCleaner()

const messageDispatcher = new MessageDispatcher()

// Limit processor
initLimitProcessor(messageDispatcher)

// Content-script's request handler
initCsHandler(messageDispatcher)

// Start server
initTrackServer(messageDispatcher)

// scheduler
initScheduler()

// Manage the context menus
initWhitelistMenuManager()

// Badge manager
badgeTextManager.init(messageDispatcher)

// Listen to tab changed
new TabListener()
    .onActivated(({ url, tabId }) => badgeTextManager.updateFocus({ url, tabId }))
    .onUpdated((tabId, { audible }) => audible !== undefined && trySendMsg2Tab(tabId, 'syncAudible', audible))
    .start()

// Start message dispatcher
messageDispatcher.start()
