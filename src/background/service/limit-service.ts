/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listTabs, sendMsg2Tab } from "@api/chrome/tab"
import db, { type LimitRecord } from "@db/limit-database"
import { sum } from "@util/array"
import { calcTimeState, hasLimited, isEffective, matches } from "@util/limit"
import { formatTimeYMD, getWeekDay, MILL_PER_MINUTE } from "@util/time"
import optionHolder from "./components/option-holder"
import { getWeekStartTime } from './components/week-helper'
import whitelistHolder from "./whitelist/holder"

export async function selectLimit(param?: timer.limit.Query): Promise<timer.limit.Item[]> {
    const { enabled, url, id, limited, effective } = param ?? {}
    const now = new Date()
    const today = formatTimeYMD(now)
    const startTime = await getWeekStartTime(now.getTime())
    const startDate = formatTimeYMD(startTime)
    const weekday = getWeekDay(now)

    let list = await db.all()

    if (enabled) list = list.filter(item => item.enabled)
    if (id) list = list.filter(item => item.id === id)
    if (url) list = list.filter(item => matches(item.cond, url))

    let items = list.map(rec => cvtRecord2Item(rec, today, startDate))

    if (limited) items = items.filter(hasLimited)
    if (effective || enabled) items = items.filter(item => item.enabled)
    if (effective) items = items.filter(item => isEffective(item.weekdays, weekday))

    return items
}

function cvtRecord2Item({ records, ...others }: LimitRecord, today: string, weekStartDate: string) {
    const todayRec = records[today]
    const thisWeekRec = Object.entries(records)
        .filter(([k]) => k >= weekStartDate && k <= today)
        .map(([, v]) => v)
    const weeklyWaste = sum(thisWeekRec.map(r => r.mill ?? 0))
    const weeklyDelayCount = sum(thisWeekRec.map(r => r.delay ?? 0))
    const weeklyVisit = sum(thisWeekRec.map(r => r.visit ?? 0))
    return {
        ...others,
        waste: todayRec?.mill ?? 0,
        visit: todayRec?.visit ?? 0,
        delayCount: todayRec?.delay ?? 0,
        weeklyWaste,
        weeklyDelayCount,
        weeklyVisit,
    }
}

/**
 * Fired if the item is removed or disabled
 *
 * @param item
 */
export async function noticeLimitChanged() {
    const effectiveItems = await selectLimit({ effective: true })
    const tabs = await listTabs()
    tabs.forEach(({ id, url }) => {
        if (!id || !url) return
        const limitedItems = effectiveItems.filter(item => matches(item.cond, url))
        sendMsg2Tab(id, 'limitChanged', limitedItems).catch(err => console.warn(err.message))
    })
}

export async function removeLimitRules(ids: number[]): Promise<void> {
    if (!ids.length) return
    await db.batchRemove(ids)
    await noticeLimitChanged()
}

type IncreaseResult = {
    limited?: timer.limit.Item[]
    reminder?: timer.limit.ReminderInfo
}

/**
 * Add time
 *
 * @param url url
 * @param focusTime time, milliseconds
 * @returns the rules is limit cause of this operation
 */
export async function addLimitFocusTime(host: string, url: string, focusTime: number): Promise<IncreaseResult> {
    if (whitelistHolder.contains(host, url)) return {}

    const allEffective = await selectLimit({ url, effective: true })

    const toUpdate: { [cond: string]: number } = {}
    const limited: timer.limit.Item[] = []
    const needReminder: timer.limit.Item[] = []

    const { limitReminder, limitReminderDuration = 0 } = await optionHolder.get()
    const durationMill = limitReminder ? limitReminderDuration * MILL_PER_MINUTE : 0
    allEffective.forEach(item => {
        const [met, reminder] = addFocusForEach(item, focusTime, durationMill)
        met && limited.push(item)
        reminder && needReminder.push(item)
        toUpdate[item.id] = item.waste
    })
    const result: IncreaseResult = { limited }
    if (needReminder?.length) {
        result.reminder = {
            items: needReminder,
            duration: limitReminderDuration,
        }
    }
    await db.updateWaste(formatTimeYMD(new Date()), toUpdate)
    return result
}

function addFocusForEach(item: timer.limit.Item, focusTime: number, durationMill: number): [met: boolean, reminder: boolean] {
    const before = calcTimeState(item, durationMill)
    item.waste += focusTime
    // Fast increase
    item.weeklyWaste += focusTime
    const after = calcTimeState(item, durationMill)
    const met = (before.daily !== 'LIMITED' && after.daily === 'LIMITED') || (before.weekly !== 'LIMITED' && after.weekly === 'LIMITED')
    const reminder = (before.daily === 'NORMAL' && after.daily === 'REMINDER') || (before.weekly === 'NORMAL' && after.weekly === 'REMINDER')
    return [met, reminder]
}

/**
 * Increase visit count
 * @returns the rules is limited
 */
export async function incLimitVisit(host: string, url: string): Promise<timer.limit.Item[]> {
    if (whitelistHolder.contains(host, url)) return []

    const allEnabled: timer.limit.Item[] = await selectLimit({ enabled: true, url })
    const result: timer.limit.Item[] = []
    await db.increaseVisit(formatTimeYMD(new Date()), allEnabled.map(item => item.id))
    allEnabled.forEach(item => {
        // Fast increase
        item.visit++
        item.weeklyVisit++

        hasLimited(item) && result.push(item)
    })
    return result
}

/**
 * @returns Rules to wake
 */
export async function moreMinutes(url: string): Promise<timer.limit.Item[]> {
    const rules = (await selectLimit({ url, enabled: true }))
        .filter(item => hasLimited(item) && item.allowDelay)
    rules.forEach(rule => {
        rule.delayCount = (rule.delayCount ?? 0) + 1
        // Fast increase
        rule.weeklyDelayCount = (rule.weeklyDelayCount ?? 0) + 1
    })

    const date = formatTimeYMD(new Date())
    await db.updateDelayCount(date, rules)
    return rules.filter(r => !hasLimited(r))
}

export async function updateLimitRules(rules: timer.limit.Rule[]): Promise<void> {
    await db.batchUpdate(rules)
    await noticeLimitChanged()
}

export async function createLimitRule(rule: Omit<timer.limit.Rule, 'id'>): Promise<number> {
    const id = await db.add(rule)
    await noticeLimitChanged()
    return id
}
