export interface PauseDetector {
    readonly paused: boolean
    onPauseChange(listener: NoArgCallback): void
}