/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getTab } from '@api/chrome/tab'
import { saveSite } from '@service/site-service'
import { IS_ANDROID, IS_CHROME, IS_FIREFOX, IS_SAFARI, isNotTrackable } from "@util/constant/environment"
import { extractHostname, isHomepage } from "@util/pattern"
import { extractSiteName } from "@util/site"
import badgeManager from "./badge-manager"
import MessageDispatcher from "./message-dispatcher"
import { incVisitCount } from './track-server/normal'

/**
 * Process the tab
 */
async function processTabInfo(tab: ChromeTab): Promise<void> {
    // Not support to modify site info on Android, so skip it
    if (IS_ANDROID) return
    let { favIconUrl: iconUrl, url, title } = tab
    if (!url || !title) return
    if (isNotTrackable(url)) return
    const hostInfo = extractHostname(url)
    const host = hostInfo.host
    if (!host) return
    // localhost hosts with Chrome use cache, so keep the favIcon url undefined
    IS_CHROME && /^localhost(:.+)?/.test(host) && (iconUrl = undefined)
    // Only collect site name for homepage
    const alias = isHomepage(url) ? extractSiteName(title) : undefined
    await saveSite({ host, type: 'normal', alias, iconUrl }, false)
}

/**
 * Collect the favicon of host
 */
const collectIconAndAlias = async (tab: ChromeTab) => {
    if (IS_SAFARI || IS_ANDROID) return
    // Tab from sender does not contain favIconUrl for FF
    if (IS_FIREFOX) tab = (tab.id ? await getTab(tab.id) : undefined) ?? tab
    processTabInfo(tab)
}

const handleInjected = async (sender: ChromeMessageSender) => {
    const { tab, url } = sender
    if (!tab) return
    await incVisitCount(tab)
    await collectIconAndAlias(tab)
    const tabId = tab.id
    await badgeManager.updateFocus(tabId && url ? { tabId, url } : undefined)
}

/**
 * Handle request from content script
 *
 * @param dispatcher message dispatcher
 */
export default function init(dispatcher: MessageDispatcher) {
    dispatcher
        .register('cs.injected', (_, sender) => handleInjected(sender))
        // Get sites which need to count run time
        .register('cs.getAudible', async (_, sender) => !!sender.tab?.audible)
}