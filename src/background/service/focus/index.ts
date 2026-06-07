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
    const { state, template, phase } = session
    if (state === 'done') {
        return [t(msg => msg.notification.focus.completedTitle), t(msg => msg.notification.focus.completedMsg)]
    } else if (template === 'pomodoro') {
        return phase === 'break'
            ? [t(msg => msg.shared.focus.break), t(msg => msg.notification.focus.breakStartMsg)]
            : [t(msg => msg.shared.focus.duration), t(msg => msg.notification.focus.focusResumeMsg)]
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
    if (typeof request === 'object') {
        await focusHolder.start(request.config, request.presetId)
    } else {
        switch (request) {
            case 'pause': return focusHolder.pause()
            case 'resume': return focusHolder.resume()
            case 'abort': return focusHolder.abort()
            case 'delay': return focusHolder.delay()
            case 'restart': return focusHolder.restart()
        }
    }
    await badgeManager.render()
    await broadcastFocusChanged()
}

export async function saveLastPopup(popup: tt4b.ui.PopupMenu | undefined): Promise<void> {
    focusHolder.popup = popup
    await badgeManager.render()
}