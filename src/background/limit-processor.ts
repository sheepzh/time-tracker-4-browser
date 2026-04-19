/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listTabs, sendMsg2Tab } from "@api/chrome/tab"
import { matches } from "@util/limit"
import { getStartOfDay, MILL_PER_DAY } from "@util/time"
import alarmManager from "./alarm-manager"
import MessageDispatcher from "./message-dispatcher"
import {
    createLimitRule, delayLimit, noticeLimitChanged, removeLimitRules, selectLimit, updateLimitRules,
} from "./service/limit-service"


function initDailyBroadcast() {
    // Broadcast rules at the start of each day
    alarmManager.setWhen(
        'limit-daily-broadcast',
        () => getStartOfDay(new Date()) + MILL_PER_DAY,
        noticeLimitChanged,
    )
}

const processAskHitVisit = async (item: timer.limit.Item) => {
    let tabs = await listTabs()
    const { cond } = item
    for (const { id, url } of tabs) {
        try {
            if (!url || !matches(cond, url) || !id) continue

            const visitHit = await sendMsg2Tab(id, "askVisitHit", item.id)
            if (visitHit) return true
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
        .register('limit.delay', delayLimit)
}