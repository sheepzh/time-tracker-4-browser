import { createNotification } from '@api/chrome/notifications'
import { hasPerm, requestPerm } from '@api/chrome/permission'
import { getIconUrl } from '@api/chrome/runtime'
import { listTabs, trySendMsg2Tab } from '@api/chrome/tab'
import badgeManager from '@bg/badge-manager'
import { t } from '@bg/i18n'
import optionHolder from '@service/components/option-holder'
import { IS_MV3, isNotTrackable } from '@util/constant/environment'
import { FOCUS_POPUP_DURATION_MS } from '@util/focus-sound'
import focusHolder from './holder'
import { playFocusSoundOffscreen, prewarmOffscreenAudio } from './offscreen-audio'

focusHolder.onTick = async session => {
    await badgeManager.render()
    await broadcastFocusChanged()
    const notification = calcNotification(session)
    if (notification[0]) {
        if (await ensureNotificationPermission()) {
            await createNotification('focus', { type: 'basic', title: notification[0], message: notification[1] })
        }
        await dispatchFocusNotice({ title: notification[0], message: notification[1] })
    }
}

function calcNotification(session: tt4b.focus.Session): [title: string, message: string] | [null, null] {
    const { state, method, phase } = session
    if (state === 'done') {
        return [t(msg => msg.notification.focus.completedTitle), t(msg => msg.notification.focus.completedMsg)]
    } else if (method === 'pomodoro') {
        return phase === 'break'
            ? [t(msg => msg.focus.break), t(msg => msg.notification.focus.breakStartMsg)]
            : [t(msg => msg.focus.duration), t(msg => msg.notification.focus.focusResumeMsg)]
    }
    return [null, null]
}

async function ensureNotificationPermission(): Promise<boolean> {
    if (await hasPerm('notifications')) return true
    return requestPerm('notifications')
}

function injectFocusNoticeFunc(
    icon: string,
    title: string,
    message: string,
    popupDurationMs: number,
): void {
    const popupId = '__TIMER_FOCUS_NOTICE_POPUP__'
    document.getElementById(popupId)?.remove()

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false
    const inverseDark = !prefersDark
    const el = document.createElement('div')
    el.id = popupId
    Object.assign(el.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '2147483647',
        display: 'flex',
        alignItems: 'center',
        width: '360px',
        minHeight: '88px',
        padding: '16px 20px',
        borderRadius: '10px',
        boxSizing: 'border-box',
        opacity: '1',
        transform: 'translateY(0)',
        transition: 'opacity .25s ease, transform .25s ease',
        pointerEvents: 'none',
        backgroundColor: inverseDark ? '#1D1E1F' : '#ffffff',
        border: inverseDark ? '1px solid #4c4d4f' : '1px solid #dcdfe6',
        boxShadow: inverseDark ? '0 8px 28px rgba(0,0,0,.55)' : '0 8px 28px rgba(0,0,0,.18)',
    } satisfies Partial<CSSStyleDeclaration>)

    const iconEl = document.createElement('img')
    iconEl.src = icon
    iconEl.width = 40
    iconEl.height = 40
    el.append(iconEl)

    const group = document.createElement('div')
    group.style.marginInlineStart = '14px'
    group.style.flex = '1'

    const titleEl = document.createElement('div')
    titleEl.textContent = title
    Object.assign(titleEl.style, {
        fontWeight: '700',
        fontSize: '17px',
        lineHeight: '26px',
        color: inverseDark ? '#E5EAF3' : '#303133',
    } satisfies Partial<CSSStyleDeclaration>)
    group.append(titleEl)

    const messageEl = document.createElement('div')
    messageEl.textContent = message
    Object.assign(messageEl.style, {
        marginTop: '6px',
        fontSize: '14px',
        lineHeight: '22px',
        color: inverseDark ? '#CFD3DC' : '#606266',
    } satisfies Partial<CSSStyleDeclaration>)
    group.append(messageEl)
    el.append(group)
    ;(document.body ?? document.documentElement).appendChild(el)

    window.setTimeout(() => {
        el.style.opacity = '0'
        el.style.transform = 'translateY(12px)'
        window.setTimeout(() => el.remove(), 250)
    }, popupDurationMs)
}

async function injectFocusNotice(tabId: number, notice: { title: string, message: string }): Promise<void> {
    if (!IS_MV3) return

    const args = [getIconUrl(), notice.title, notice.message, FOCUS_POPUP_DURATION_MS] as const
    await chrome.scripting.executeScript({
        target: { tabId },
        func: injectFocusNoticeFunc,
        args: [...args],
    })
}

async function dispatchFocusNotice(notice: { title: string, message: string }): Promise<void> {
    const { focusSoundEnabled } = await optionHolder.get()
    if (focusSoundEnabled) {
        await playFocusSoundOffscreen()
    }
    await dispatchFocusPopup(notice)
}

async function dispatchFocusPopup(notice: { title: string, message: string }): Promise<void> {
    const isTrackable = (tab: ChromeTab) => !!tab.id && !!tab.url && !isNotTrackable(tab.url)
    const [focusedTab] = await listTabs({ active: true, lastFocusedWindow: true })

    if (focusedTab?.id && isTrackable(focusedTab)) {
        const delivered = await trySendMsg2Tab(focusedTab.id, 'playFocusSound', notice)
        if (delivered) return

        if (IS_MV3) {
            try {
                await injectFocusNotice(focusedTab.id, notice)
            } catch {
                // ignore
            }
        }
        return
    }

    const tabs = await listTabs()
    const fallbackTab = tabs.find(isTrackable)
    if (!fallbackTab?.id) return

    const delivered = await trySendMsg2Tab(fallbackTab.id, 'playFocusSound', notice)
    if (delivered) return

    if (!IS_MV3) return
    try {
        await injectFocusNotice(fallbackTab.id, notice)
    } catch {
        // ignore
    }
}

async function broadcastFocusChanged(): Promise<void> {
    const tabs = await listTabs()
    const session = focusHolder.current
    for (const { id: tabId, url } of tabs) {
        if (!tabId || !url || isNotTrackable(url)) continue
        void trySendMsg2Tab(tabId, 'focusChanged', session)
    }
}

export async function handleAction(request: tt4b.focus.ActionRequest): Promise<void> {
    await dispatchAction(request)
    await badgeManager.render()
    await broadcastFocusChanged()
}

function dispatchAction(action: tt4b.focus.ActionRequest): Promise<void> {
    if (typeof action === 'object') {
        void prewarmOffscreenAudio()
        return focusHolder.start(action.config, action.presetId)
    }
    switch (action) {
        case 'pause': return focusHolder.pause()
        case 'resume': return focusHolder.resume()
        case 'stop': return focusHolder.stop()
        case 'delay': return focusHolder.delay()
        case 'dismiss': return focusHolder.dismiss()
        default: return Promise.resolve()
    }
}

export async function saveLastPopup(popup: tt4b.ui.PopupMenu | undefined): Promise<void> {
    focusHolder.popup = popup
    await badgeManager.render()
}
