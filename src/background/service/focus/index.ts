import badgeManager from '@/background/badge-manager'
import { createNotification } from '@api/chrome/notifications'
import { listTabs, trySendMsg2Tab } from '@api/chrome/tab'
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
        return ['Focus Completed', 'Your focus session has completed. Great job!']
    } else if (template === 'pomodoro') {
        return phase === 'break'
            ? ['Break Time', 'Take a short break. You earned it!']
            : ['Focus Time', 'Break is over. Time to focus again!']
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