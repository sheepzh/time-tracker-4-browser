/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { APP_ANALYSIS_ROUTE } from '@/shared/route'
import { executeScript } from "@api/chrome/script"
import { createTab } from "@api/chrome/tab"
import { getAppPageUrl } from "@util/constant/url"
import { extractHostname } from "@util/pattern"
import badgeManager from "./badge-manager"
import { collectIconAndAlias } from "./icon-and-alias-collector"
import MessageDispatcher from "./message-dispatcher"

const handleOpenAnalysisPage = (sender: ChromeMessageSender) => {
    const { tab, url } = sender || {}
    if (!url) return
    const { host } = extractHostname(url)
    const newTabUrl = getAppPageUrl(APP_ANALYSIS_ROUTE, { host })

    const tabIndex = tab?.index
    const newTabIndex = tabIndex ? tabIndex + 1 : undefined
    createTab({ url: newTabUrl, index: newTabIndex })
}

const handleInjected = async (sender: ChromeMessageSender) => {
    const tabId = sender?.tab?.id
    if (!tabId) return
    collectIconAndAlias(tabId)
    badgeManager.updateFocus()
    executeScript(tabId, ['content_scripts.js'])
}

/**
 * Handle request from content script
 *
 * @param dispatcher message dispatcher
 */
export default function init(dispatcher: MessageDispatcher) {
    dispatcher
        // Judge is in whitelist
        .register('cs.openAnalysis', (_, sender) => handleOpenAnalysisPage(sender))
        .register('cs.onInjected', (_, sender) => handleInjected(sender))
        // Get sites which need to count run time
        .register('cs.getAudible', async (_, sender) => !!sender.tab?.audible)
}