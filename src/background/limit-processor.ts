/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listTabs, sendMsg2Tab } from "@api/chrome/tab"
import { matches } from "@util/limit"
import { getStartOfDay, MILL_PER_DAY, MILL_PER_SECOND } from "@util/time"
import alarmManager from "./alarm-manager"
import MessageDispatcher from "./message-dispatcher"
import {
    createLimitRule, moreMinutes, noticeLimitChanged, removeLimitRules, selectLimit, updateLimitRules,
} from "./service/limit-service"

function processLimitWaking(rules: timer.limit.Item[], tab: ChromeTab): void {
    const { url, id: tabId } = tab
    if (!url || !tabId) return
    const anyMatch = rules.map(rule => matches(rule.cond, url)).reduce((a, b) => a || b, false)
    if (!anyMatch) {
        return
    }
    sendMsg2Tab(tabId, 'limitWaking', rules)
        .then(() => console.log(`Waked tab[id=${tab.id}]`))
        .catch(err => console.error(`Failed to wake with limit rule: rules=${JSON.stringify(rules)}, msg=${err.message}`))
}

function initDailyBroadcast() {
    // Broadcast rules at the start of each day
    alarmManager.setWhen(
        'limit-daily-broadcast',
        () => getStartOfDay(new Date()) + MILL_PER_DAY,
        noticeLimitChanged,
    )
}

const processMoreMinutes = async (url: string) => {
    const rules = await moreMinutes(url)

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
        .register('limit.list', selectLimit)
        .register('limit.delete', removeLimitRules)
        .register('limit.update', updateLimitRules)
        .register('limit.add', createLimitRule)
        .register('limit.hitVisit', processAskHitVisit)
        .register('limit.delay', processMoreMinutes)
}