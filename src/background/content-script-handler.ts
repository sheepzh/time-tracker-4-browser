/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import optionHolder from "@/background/service/components/option-holder"
import { getSite } from "@/background/service/site-service"
import timelineThrottler from '@/background/service/throttler/timeline-throttler'
import whitelistHolder from "@/background/service/whitelist/holder"
import { executeScript } from "@api/chrome/script"
import { createTab } from "@api/chrome/tab"
import { ANALYSIS_ROUTE, LIMIT_ROUTE } from "@app/router/constants"
import { getAppPageUrl } from "@util/constant/url"
import { extractFileHost, extractHostname } from "@util/pattern"
import badgeManager from "./badge-manager"
import { collectIconAndAlias } from "./icon-and-alias-collector"
import MessageDispatcher from "./message-dispatcher"

const handleOpenAnalysisPage = (sender: ChromeMessageSender) => {
    const { tab, url } = sender || {}
    if (!url) return
    const host = extractFileHost(url) || extractHostname(url)?.host
    const newTabUrl = getAppPageUrl(ANALYSIS_ROUTE, { host })

    const tabIndex = tab?.index
    const newTabIndex = tabIndex ? tabIndex + 1 : undefined
    createTab({ url: newTabUrl, index: newTabIndex })
}

const handleOpenLimitPage = (sender: ChromeMessageSender) => {
    const { tab, url } = sender || {}
    if (!url) return
    const newTabUrl = getAppPageUrl(LIMIT_ROUTE, { url })
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
        .register('cs.isInWhitelist', ({ host, url } = {}) => !!host && !!url && whitelistHolder.contains(host, url))
        // Need to print the information of today
        .register('cs.printTodayInfo', async () => (await optionHolder.get()).printInConsole)
        .register('cs.openAnalysis', (_, sender) => handleOpenAnalysisPage(sender))
        .register('cs.openLimit', (_, sender) => handleOpenLimitPage(sender))
        .register('cs.onInjected', (_, sender) => handleInjected(sender))
        // Get sites which need to count run time
        .register('cs.getRunSites', async url => {
            const { host } = extractHostname(url) || {}
            if (!host) return undefined
            const site: timer.site.SiteKey = { host, type: 'normal' }
            const exist = await getSite(site)
            return exist?.run ? site : undefined
        })
        .register('cs.getAudible', async (_, sender) => !!sender.tab?.audible)
        .register('cs.timelineEv', ev => timelineThrottler.saveEvent(ev))
}