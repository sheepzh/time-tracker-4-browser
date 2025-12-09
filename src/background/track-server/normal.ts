import { lastActivatedTabId, listTabs, sendMsg2Tab } from "@api/chrome/tab"
import { lastFocusedNormalWinId } from "@api/chrome/window"
import optionHolder from "@service/components/option-holder"
import itemService, { type ItemIncContext } from "@service/item-service"
import limitService from "@service/limit-service"
import periodThrottler from '@service/throttler/period-throttler'
import whitelistHolder from "@service/whitelist/holder"
import { IS_ANDROID } from "@util/constant/environment"
import { extractHostname } from "@util/pattern"
import badgeManager from '../badge-manager'

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

export async function handleTrackTimeEvent(event: timer.core.Event, senderTab: ChromeTab | undefined): Promise<void> {
    const { url, start, end, ignoreTabCheck } = event
    const { id: tabId, windowId, groupId } = senderTab ?? {}
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
        badgeManager.updateFocus({ tabId, url })
    }
}

async function windowNotFocused(winId: number | undefined): Promise<boolean> {
    if (IS_ANDROID) return false
    if (!winId) return true
    const focusedWinId = await lastFocusedNormalWinId()
    return focusedWinId !== winId
}

async function tabNotActive(tabId: number | undefined): Promise<boolean> {
    if (!tabId) return true
    const lastActivated = await lastActivatedTabId()
    return lastActivated !== tabId
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

export async function handleIncVisitEvent(param: { host: string, url: string }, sender: ChromeMessageSender): Promise<void> {
    const { host, url } = param
    const { groupId } = sender?.tab ?? {}
    const { protocol } = extractHostname(url)
    const option = await optionHolder.get()
    if (protocol === "file" && !option.countLocalFiles) return
    await handleVisit({ host, url, groupId })
}

