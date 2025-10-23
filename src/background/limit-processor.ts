/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { createTabAfterCurrent, getRightOf, listTabs, resetTabUrl, sendMsg2Tab } from "@api/chrome/tab"
import { LIMIT_ROUTE } from "@app/router/constants"
import { moreMinutes, noticeLimitChanged } from "@service/limit-service"
import { getAppPageUrl } from "@util/constant/url"
import { matches } from "@util/limit"
import { isBrowserUrl } from "@util/pattern"
import { getStartOfDay, MILL_PER_DAY, MILL_PER_SECOND } from "@util/time"
import alarmManager from "./alarm-manager"
import MessageDispatcher from "./message-dispatcher"

function processLimitWaking(rules: timer.limit.Item[], tab: ChromeTab): void {
    const { url, id: tabId } = tab
    if (!url || !tabId) return
    const anyMatch = rules.map(rule => matches(rule?.cond, url)).reduce((a, b) => a || b, false)
    if (!anyMatch) {
        return
    }
    sendMsg2Tab(tabId, 'limitWaking', rules)
        .then(() => console.log(`Waked tab[id=${tab.id}]`))
        .catch(err => console.error(`Failed to wake with limit rule: rules=${JSON.stringify(rules)}, msg=${err.msg}`))
}

async function processOpenPage(limitedUrl: string, sender: ChromeMessageSender) {
    const originTab = sender?.tab
    if (!originTab) return
    const realUrl = getAppPageUrl(LIMIT_ROUTE, { url: encodeURI(limitedUrl) })
    const baseUrl = getAppPageUrl(LIMIT_ROUTE)
    const rightTab = await getRightOf(originTab)
    const { id: rightId, url: rightUrl } = rightTab || {}
    if (rightId && rightUrl && isBrowserUrl(rightUrl) && rightUrl.includes(baseUrl)) {
        // Reset url
        await resetTabUrl(rightId, realUrl)
    } else {
        await createTabAfterCurrent(realUrl, sender?.tab)
    }
}

function initDailyBroadcast() {
    // Broadcast rules at the start of each day
    alarmManager.setWhen(
        'limit-daily-broadcast',
        () => {
            const startOfThisDay = getStartOfDay(new Date())
            return startOfThisDay.getTime() + MILL_PER_DAY
        },
        () => noticeLimitChanged(),
    )
}

const processMoreMinutes = async (data: any) => {
    const { url, duration } = (data as timer.mq.DelayMinutesData) ?? {}
    const rules = await moreMinutes(url, duration)

    const tabs = await listTabs({ status: 'complete' })
    tabs.forEach(tab => processLimitWaking(rules, tab))
}

const processAskHitVisit = async (item: timer.limit.Item) => {
    let tabs = await listTabs()
    const { visitTime = 0, cond } = item || {}
    for (const { id, url } of tabs) {
        try {
            if (!url || !matches(cond, url) || !id) continue

            const tabFocus = await sendMsg2Tab(id, "askVisitTime")
            if (tabFocus && tabFocus > visitTime * MILL_PER_SECOND) return true
        } catch {
            // Ignored
        }
    }
    return false
}

export default function init(dispatcher: MessageDispatcher) {
    initDailyBroadcast()
    dispatcher
        .register<string>('openLimitPage', processOpenPage)
        // More minutes
        .register<string>('cs.delayMinutes', processMoreMinutes)
        // Judge any tag hit the time limit per visit
        .register<timer.limit.Item, boolean>("askHitVisit", processAskHitVisit)
}