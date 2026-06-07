import type { Reason } from './types'

export function isSameReason(a: Reason, b: Reason): boolean {
    if (a.type === 'FOCUS' && b.type === 'FOCUS') {
        // There is at most one focus reason, so just return true
        return true
    }
    if (a.type === 'FOCUS' || b.type === 'FOCUS') return false

    if (a?.id !== b?.id || a?.type !== b?.type) return false
    if (a?.type === 'DAILY' || a?.type === 'VISIT') {
        // Need judge allow delay
        if (a?.allowDelay !== b?.allowDelay) return false
    }
    return true
}

export async function exitFullscreen(): Promise<void> {
    if (!document?.fullscreenElement) return
    if (!document?.exitFullscreen) return
    try {
        await document.exitFullscreen()
    } catch (e) {
        console.warn('Failed to exit fullscreen', e)
    }
}