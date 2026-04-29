/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listTabs, sendMsg2Tab } from "@api/chrome/tab"
import db, { type LimitRecord } from "@db/limit-database"
import { sum } from "@util/array"
import { hasLimited, isEffective, matches, meetTimeLimit } from "@util/limit"
import { formatTimeYMD, getWeekDay, MILL_PER_MINUTE, MILL_PER_SECOND } from "@util/time"
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

    if (limited) {
        const { limitDelayDuration } = await optionHolder.get()
        items = items.filter(item => hasLimited(item, limitDelayDuration))
    }
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
export async function noticeLimitChanged(): Promise<void> {
    const tabs = await listTabs()
    tabs.forEach(({ id, url }) => {
        if (!id || !url) return
        sendMsg2Tab(id, 'limitChanged').catch(err => console.info(err?.message))
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

    const { limitReminder, limitReminderDuration = 0, limitDelayDuration } = await optionHolder.get()
    const durationMill = limitReminder ? limitReminderDuration * MILL_PER_MINUTE : 0
    allEffective.forEach(item => {
        const [met, reminder] = addFocusForEach(item, focusTime, durationMill, limitDelayDuration)
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

type TimeLimitState = 'NORMAL' | 'REMINDER' | 'LIMITED'

type LimitTimeStateResult = {
    daily: TimeLimitState
    weekly: TimeLimitState
}

export function calcTimeState(item: timer.limit.Item, reminderMills: number, delayDuration: number): LimitTimeStateResult {
    const res: LimitTimeStateResult = { daily: 'NORMAL', weekly: 'NORMAL' }
    const {
        time, waste, delayCount,
        weekly, weeklyWaste, weeklyDelayCount,
        allowDelay,
    } = item || {}
    const dailyMs = (time ?? 0) * MILL_PER_SECOND
    const weeklyMs = (weekly ?? 0) * MILL_PER_SECOND
    const delayDaily = { count: delayCount ?? 0, duration: delayDuration, allow: !!allowDelay }
    const delayWeekly = { count: weeklyDelayCount ?? 0, duration: delayDuration, allow: !!allowDelay }
    if (meetTimeLimit({ wasted: waste, maxLimit: dailyMs }, delayDaily)) res.daily = 'LIMITED'
    else if (reminderMills && meetTimeLimit({ wasted: waste + reminderMills, maxLimit: dailyMs }, delayDaily)) res.daily = 'REMINDER'
    if (meetTimeLimit({ wasted: weeklyWaste, maxLimit: weeklyMs }, delayWeekly)) res.weekly = 'LIMITED'
    else if (reminderMills && meetTimeLimit({ wasted: weeklyWaste + reminderMills, maxLimit: weeklyMs }, delayWeekly)) res.weekly = 'REMINDER'
    return res
}

function addFocusForEach(item: timer.limit.Item, focusTime: number, durationMill: number, delayDuration: number): [met: boolean, reminder: boolean] {
    const before = calcTimeState(item, durationMill, delayDuration)
    item.waste += focusTime
    // Fast increase
    item.weeklyWaste += focusTime
    const after = calcTimeState(item, durationMill, delayDuration)
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

    const allEnabled = await selectLimit({ enabled: true, url })
    const { limitDelayDuration: delayDuration } = await optionHolder.get()
    const result: timer.limit.Item[] = []
    await db.increaseVisit(formatTimeYMD(new Date()), allEnabled.map(item => item.id))
    allEnabled.forEach(item => {
        // Fast increase
        item.visit++
        item.weeklyVisit++

        hasLimited(item, delayDuration) && result.push(item)
    })
    return result
}

export async function delayLimit(url: string): Promise<void> {
    const limitedItems = await selectLimit({ url, enabled: true, limited: true })
    limitedItems
        .filter(item => item.allowDelay)
        .forEach(rule => {
            rule.delayCount++
            rule.weeklyDelayCount++
        })

    const date = formatTimeYMD(new Date())
    await db.updateDelayCount(date, limitedItems)
    await noticeLimitChanged()
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
