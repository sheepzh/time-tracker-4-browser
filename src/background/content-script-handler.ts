/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { executeScript } from "@api/chrome/script"
import { createTab } from "@api/chrome/tab"
import { ANALYSIS_ROUTE, LIMIT_ROUTE } from "@app/router/constants"
import optionHolder from "@service/components/option-holder"
import whitelistHolder from "@service/components/whitelist-holder"
import limitService from "@service/limit-service"
import siteService from "@service/site-service"
import { saveTimelineEvent } from '@service/timeline-service'
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
        .register<{ host?: string, url?: string }, boolean>('cs.isInWhitelist', ({ host, url } = {}) => !!host && !!url && whitelistHolder.contains(host, url))
        // Need to print the information of today
        .register<void, boolean>('cs.printTodayInfo', async () => {
            const option = await optionHolder.get()
            return !!option.printInConsole
        })
        .register<string, timer.limit.Item[]>('cs.getLimitedRules', url => limitService.getLimited(url))
        .register<string, timer.limit.Item[]>('cs.getRelatedRules', url => limitService.getRelated(url))
        .register<void, void>('cs.openAnalysis', (_, sender) => handleOpenAnalysisPage(sender))
        .register<void, void>('cs.openLimit', (_, sender) => handleOpenLimitPage(sender))
        .register<void, void>('cs.onInjected', async (_, sender) => handleInjected(sender))
        // Get sites which need to count run time
        .register<string, timer.site.SiteKey | null>('cs.getRunSites', async url => {
            const { host } = extractHostname(url) || {}
            if (!host) return null
            const site: timer.site.SiteKey = { host, type: 'normal' }
            const exist = await siteService.get(site)
            return exist?.run ? site : null
        })
        .register<timer.timeline.Event, void>('cs.timelineEv', ev => saveTimelineEvent(ev))
}