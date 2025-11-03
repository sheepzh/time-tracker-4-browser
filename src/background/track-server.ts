import { getTab, listTabs, sendMsg2Tab } from "@api/chrome/tab"
import { getWindow } from "@api/chrome/window"
import optionHolder from "@service/components/option-holder"
import itemService, { type ItemIncContext } from "@service/item-service"
import limitService from "@service/limit-service"
import periodThrottler from '@service/throttler/period-throttler'
import whitelistHolder from "@service/whitelist/holder"
import { IS_ANDROID } from "@util/constant/environment"
import { extractHostname } from "@util/pattern"
import { formatTimeYMD, getStartOfDay, MILL_PER_DAY } from "@util/time"
import badgeManager from "./badge-manager"
import MessageDispatcher from "./message-dispatcher"

async function handleTime(context: ItemIncContext, timeRange: [number, number], tabId: number | undefined): Promise<number> {
    const { host, url } = context
    const [start, end] = timeRange
    const focusTime = end - start
    // 1. Save async
    await itemService.addFocusTime(context, focusTime)
    // 2. Process limit
    const { limited, reminder } = await limitService.addFocusTime(host, url, focusTime)
    // If time limited after this operation, send messages
    limited?.length && sendLimitedMessage(limited)
    // If need to reminder, send messages
    reminder?.items?.length && tabId && sendMsg2Tab(tabId, 'limitReminder', reminder)
    // 3. Add period time
    periodThrottler.add(start, focusTime)
    return focusTime
}

async function handleTrackTimeEvent(event: timer.core.Event, sender: ChromeMessageSender): Promise<void> {
    const { url, start, end, ignoreTabCheck } = event
    const { id: tabId, windowId, groupId } = sender?.tab || {}
    if (!ignoreTabCheck) {
        if (await windowNotFocused(windowId)) return
        if (await tabNotActive(tabId)) return
    }
    const { protocol, host } = extractHostname(url) || {}
    const option = await optionHolder.get()

    if (protocol === "file" && !option?.countLocalFiles) return
    if (whitelistHolder.contains(host, url)) return

    await handleTime({ host, url, groupId }, [start, end], tabId)
    if (tabId) {
        const winTabs = await listTabs({ active: true, windowId })
        const firstActiveTab = winTabs?.[0]
        // Cause there is no way to determine whether this tab is selected in screen-split mode
        // So only show badge for first tab for screen-split mode
        // @see #246
        firstActiveTab?.id === tabId && badgeManager.updateFocus({ tabId, url })
    }
}

async function windowNotFocused(winId: number | undefined): Promise<boolean> {
    if (IS_ANDROID) return false
    if (!winId) return true
    const window = await getWindow(winId)
    return !window?.focused
}

async function tabNotActive(tabId: number | undefined): Promise<boolean> {
    if (!tabId) return true
    const tab = await getTab(tabId)
    return !tab?.active
}

async function sendLimitedMessage(items: timer.limit.Item[]) {
    const tabs = await listTabs()
    if (!tabs?.length) return
    for (const tab of tabs) {
        try {
            const { id } = tab
            id && await sendMsg2Tab(id, 'limitTimeMeet', items)
        } catch {
            /* Ignored */
        }
    }
}

async function handleVisit(context: ItemIncContext) {
    await itemService.increaseVisit(context)
    const { host, url } = context
    const metLimits = await limitService.incVisit(host, url)
    // If time limited after this operation, send messages
    metLimits?.length && sendLimitedMessage(metLimits)
}

async function handleIncVisitEvent(param: { host: string, url: string }, sender: ChromeMessageSender): Promise<void> {
    const { host, url } = param || {}
    const { groupId } = sender?.tab ?? {}
    const { protocol } = extractHostname(url) || {}
    const option = await optionHolder.get()
    if (protocol === "file" && !option.countLocalFiles) return
    await handleVisit({ host, url, groupId })
}

function splitRunTime(start: number, end: number): Record<string, number> {
    const res: Record<string, number> = {}
    while (start < end) {
        const startOfNextDay = getStartOfDay(start).getTime() + MILL_PER_DAY
        const newStart = Math.min(end, startOfNextDay)
        const runTime = newStart - start
        runTime && (res[formatTimeYMD(start)] = runTime)
        start = newStart
    }
    return res
}

const RUN_TIME_END_CACHE: { [host: string]: number } = {}

async function handleTrackRunTimeEvent(event: timer.core.Event): Promise<void> {
    const { start, end, url, host } = event || {}
    if (!host || !start || !end) return
    if (whitelistHolder.contains(host, url)) return
    const realStart = Math.max(RUN_TIME_END_CACHE[host] ?? 0, start)
    const byDate = splitRunTime(realStart, end)
    if (!Object.keys(byDate).length) return
    await itemService.addRunTime(host, byDate)
    RUN_TIME_END_CACHE[host] = Math.max(end, realStart)
}

function handleTabGroupRemove(group: chrome.tabGroups.TabGroup) {
    itemService.batchDeleteGroupById(group.id)
}

function handleTabGroupEnabled() {
    try {
        chrome.tabGroups.onRemoved.removeListener(handleTabGroupRemove)
        chrome.tabGroups.onRemoved.addListener(handleTabGroupRemove)
    } catch (e) {
        console.warn('failed to handle event: enableTabGroup', e)
    }
}

export default function initTrackServer(messageDispatcher: MessageDispatcher) {
    messageDispatcher
        .register<timer.core.Event, void>('cs.trackTime', handleTrackTimeEvent)
        .register<timer.core.Event, void>('cs.trackRunTime', handleTrackRunTimeEvent)
        .register<{ host: string, url: string }, void>('cs.incVisitCount', handleIncVisitEvent)
        .register<string, timer.core.Result>('cs.getTodayInfo', host => itemService.getResult(host, new Date()))
        .register<void, void>('enableTabGroup', handleTabGroupEnabled)
}
