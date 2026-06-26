import { createNotification } from '@api/chrome/notifications'
import { listTabs, trySendMsg2Tab } from '@api/chrome/tab'
import badgeManager from '@bg/badge-manager'
import { t } from '@bg/i18n'
import focusHolder from './holder'

focusHolder.onTick = async session => {
    await badgeManager.render()
    await broadcastFocusChanged()
    const [title, message] = calcNotification(session)
    title && await createNotification('focus', { type: 'basic', title, message })
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

async function broadcastFocusChanged(): Promise<void> {
    const tabs = await listTabs()
    const session = focusHolder.current
    for (const { id: tabId } of tabs) {
        if (!tabId) continue
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