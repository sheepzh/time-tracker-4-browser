import type { LimitReason } from './types'

export function isSameReason(a: LimitReason, b: LimitReason): boolean {
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