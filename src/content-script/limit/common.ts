export type LimitReason =
    & RequiredPick<timer.limit.Rule, 'id' | 'cond'>
    & PartialPick<timer.limit.Item, 'delayCount' | 'allowDelay'>
    & {
        type: timer.limit.ReasonType
        getVisitTime?: () => number
    }

export function isSameReason(a: LimitReason, b: LimitReason): boolean {
    if (a?.id !== b?.id || a?.type !== b?.type) return false
    if (a?.type === 'DAILY' || a?.type === 'VISIT') {
        // Need judge allow delay
        if (a?.allowDelay !== b?.allowDelay) return false
    }
    return true
}

export interface MaskModal {
    addReason(...reasons: LimitReason[]): void
    removeReason(...reasons: LimitReason[]): void
    removeReasonsByType(...types: timer.limit.ReasonType[]): void
    addDelayHandler(handler: () => void): void
}

export type ModalContext = {
    url: string
    modal: MaskModal
}

export interface Processor {
    handleMsg(code: timer.mq.tab.TabCode, data: unknown): Awaitable<timer.mq.tab.TabResponse<timer.mq.tab.TabCode>>
    init(): void | Promise<void>
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