export interface PauseDetector {
    readonly reason: PauseReason
    readonly paused: boolean
    onPauseChange(listener: ArgCallback<PauseDetector>): void
}

export type PauseReason = 'visible' | 'idle' | 'initial' | 'limit'