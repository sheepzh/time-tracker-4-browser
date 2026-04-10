/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { IS_ANDROID, IS_CHROME, IS_SAFARI } from "@util/constant/environment"
import { extractHostname, isBrowserUrl, isHomepage } from "@util/pattern"
import { extractSiteName } from "@util/site"
import badgeManager from "./badge-manager"
import MessageDispatcher from "./message-dispatcher"
import { saveAlias, saveIconUrl } from "./service/site-service"
import { incVisitCount } from './track-server/normal'

function isUrl(title: string) {
    return title.startsWith('https://') || title.startsWith('http://') || title.startsWith('ftp://')
}

async function collectAlias(key: timer.site.SiteKey, tabTitle: string) {
    if (!tabTitle) return
    if (isUrl(tabTitle)) return
    const siteName = extractSiteName(tabTitle, key.host)
    siteName && await saveAlias(key, siteName, true)
}

/**
 * Process the tab
 */
async function processTabInfo(tab: ChromeTab): Promise<void> {
    let { favIconUrl, url, title } = tab
    if (!url || !title) return
    if (isBrowserUrl(url)) return
    const hostInfo = extractHostname(url)
    const host = hostInfo.host
    if (!host) return
    // localhost hosts with Chrome use cache, so keep the favIcon url undefined
    IS_CHROME && /^localhost(:.+)?/.test(host) && (favIconUrl = undefined)
    const siteKey: timer.site.SiteKey = { host, type: 'normal' }
    favIconUrl && await saveIconUrl(siteKey, favIconUrl)
    !IS_ANDROID
        && !isBrowserUrl(url)
        && isHomepage(url)
        && await collectAlias(siteKey, title)
}

/**
 * Collect the favicon of host
 */
const collectIconAndAlias = async (tab: ChromeTab) => {
    if (IS_SAFARI || IS_ANDROID) return
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