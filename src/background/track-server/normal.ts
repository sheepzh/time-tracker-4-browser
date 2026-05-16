import { listTabs, sendMsg2Tab } from "@api/chrome/tab"
import { getWindow } from '@api/chrome/window'
import optionHolder from "@service/components/option-holder"
import {
    addFocusTime as addItemFocusTime, increaseVisit as increaseItemVisit, type ItemIncContext,
} from "@service/item-service"
import { addLimitFocusTime, incLimitVisit } from '@service/limit-service'
import periodThrottler from '@service/throttler/period-throttler'
import whitelistHolder from "@service/whitelist/holder"
import { IS_ANDROID } from "@util/constant/environment"
import { extractHostname } from "@util/pattern"
import badgeManager from "../badge-manager"

async function handleTime(context: ItemIncContext, timeRange: [number, number], tabId: number | undefined): Promise<number> {
    const { host, url } = context
    const [start, end] = timeRange
    const focusTime = end - start
    // 1. Save async
    await addItemFocusTime(context, focusTime)
    // 2. Process limit
    const { limited, reminder } = await addLimitFocusTime(host, url, focusTime)
    // If time limited after this operation, send messages
    limited.length && void sendLimitedMessage(limited)
    // If need to reminder, send messages
    reminder?.items?.length && tabId && void sendMsg2Tab(tabId, 'limitReminder', reminder)
    // 3. Add period time
    periodThrottler.add(start, focusTime)
    return focusTime
}

export async function handleTrackTimeEvent(event: timer.core.Event, tab: ChromeTab | undefined): Promise<void> {
    if (!tab) return
    const { id: tabId, windowId, groupId, url, active } = tab
    if (!url) return

    const { start, end, ignoreTabCheck } = event
    if (!ignoreTabCheck) {
        if (await windowNotFocused(windowId)) return
        if (!active) return
    }
    const { protocol, host } = extractHostname(url)

    const { countLocalFiles } = await optionHolder.get()
    if (protocol === "file" && !countLocalFiles) return

    if (whitelistHolder.contains(host, url)) return

    await handleTime({ host, url, groupId }, [start, end], tabId)
    if (tabId) {
        if (!ignoreTabCheck) {
            // Cause there is no way to determine whether this tab is selected in screen-split mode
            // So only show badge for first tab for screen-split mode
            // @see #246
            const winTabs = await listTabs({ active: true, windowId })
            const firstActiveTab = winTabs[0]
            if (firstActiveTab?.id !== tabId) return
        }
        void badgeManager.updateFocus({ tabId, url })
    }
}

async function windowNotFocused(winId: number | undefined): Promise<boolean> {
    if (IS_ANDROID) return false
    if (!winId) return true
    const window = await getWindow(winId)
    return !window?.focused
}

async function sendLimitedMessage(items: timer.limit.Item[]) {
    const tabs = await listTabs()
    if (!tabs.length) return
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
    await increaseItemVisit(context)
    const { host, url } = context
    const metLimits = await incLimitVisit(host, url)
    // If time limited after this operation, send messages
    metLimits.length && await sendLimitedMessage(metLimits)
}

export async function incVisitCount(tab: ChromeTab | undefined): Promise<void> {
    const { groupId, url } = tab ?? {}
    if (!url) return
    const { protocol, host } = extractHostname(url)
    const option = await optionHolder.get()
    if (protocol === "file" && !option.countLocalFiles) return
    await handleVisit({ host, url, groupId })
}

