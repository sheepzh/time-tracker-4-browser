/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listTabs, sendMsg2Tab } from "@api/chrome/tab"
import LimitDatabase from "@db/limit-database"
import optionHolder from "@service/components/option-holder"
import weekHelper from "@service/components/week-helper"
import { sum } from "@util/array"
import { calcTimeState, hasLimited, isEnabledAndEffective, matches } from "@util/limit"
import { formatTimeYMD, MILL_PER_MINUTE } from "@util/time"
import whitelistHolder from '../components/whitelist-holder'

const storage = chrome.storage.local
const db: LimitDatabase = new LimitDatabase(storage)

export type QueryParam = {
    filterDisabled: boolean
    id?: number
    url?: string
}

async function select(cond?: QueryParam): Promise<timer.limit.Item[]> {
    const { filterDisabled, url, id } = cond || {}
    const now = new Date()
    const today = formatTimeYMD(now)
    const [startDate, endDate] = await weekHelper.getWeekDateRange(now)

    return (await db.all())
        .filter(item => filterDisabled ? item.enabled : true)
        .filter(item => !id || id === item?.id)
        // If use url, then test it
        .filter(item => !url || matches(item?.cond, url))
        .map(({ records, ...others }) => {
            const todayRec = records[today]
            const thisWeekRec = Object.entries(records)
                .filter(([k]) => k >= startDate && k <= endDate)
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
            } satisfies timer.limit.Item
        })
}

async function selectEffective(url?: string) {
    const enabledItems: timer.limit.Item[] = await select({ filterDisabled: true, url })
    return enabledItems?.filter(isEnabledAndEffective) || []
}

/**
 * Fired if the item is removed or disabled
 *
 * @param item
 */
async function noticeLimitChanged() {
    const effectiveItems = await selectEffective()
    const tabs = await listTabs()
    tabs.forEach(tab => {
        const limitedItems = effectiveItems.filter(item => matches(item?.cond, tab.url))
        sendMsg2Tab(tab?.id, 'limitChanged', limitedItems)
            .catch(err => console.log(err.message))
    })
}

async function updateEnabled(item: timer.limit.Item): Promise<void> {
    await db.updateEnabled(item.id, item.enabled)
    await noticeLimitChanged()
}

async function updateDelay(item: timer.limit.Item) {
    await db.updateDelay(item.id, item.allowDelay)
    await noticeLimitChanged()
}

async function remove(item: timer.limit.Item): Promise<void> {
    await db.remove(item.id)
    await noticeLimitChanged()
}

async function getLimited(url: string): Promise<timer.limit.Item[]> {
    const list: timer.limit.Item[] = await getRelated(url)
    return list.filter(item => hasLimited(item))
}

async function getRelated(url: string): Promise<timer.limit.Item[]> {
    const effectiveItems = await selectEffective()
    return effectiveItems.filter(item => matches(item?.cond, url))
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
async function addFocusTime(host: string, url: string, focusTime: number): Promise<IncreaseResult> {
    if (whitelistHolder.contains(host, url)) return {}

    const allEffective = await selectEffective(url)

    const toUpdate: { [cond: string]: number } = {}
    const limited: timer.limit.Item[] = []
    const needReminder: timer.limit.Item[] = []

    const { limitReminder, limitReminderDuration } = await optionHolder.get()
    const durationMill = limitReminder ? (limitReminderDuration ?? 0) * MILL_PER_MINUTE : 0
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
async function incVisit(host: string, url: string): Promise<timer.limit.Item[]> {
    if (whitelistHolder.contains(host, url)) return []

    const allEnabled: timer.limit.Item[] = await select({ filterDisabled: true, url })
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
async function moreMinutes(url: string): Promise<timer.limit.Item[]> {
    const rules = (await select({ url: url, filterDisabled: true }))
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

async function update(rule: timer.limit.Rule) {
    await db.save(rule, true)
    await noticeLimitChanged()
}

async function create(rule: timer.limit.Rule) {
    await db.save(rule, false)
    await noticeLimitChanged()
}

class LimitService {
    moreMinutes = moreMinutes
    getLimited = getLimited
    getRelated = getRelated
    updateEnabled = updateEnabled
    updateDelay = updateDelay
    select = select
    remove = remove
    update = update
    create = create
    broadcastRules = noticeLimitChanged
    addFocusTime = addFocusTime
    incVisit = incVisit
}

export default new LimitService()
