import type { PauseDetector, PauseReason } from './types'

class DocVisibleDetector implements PauseDetector {
    reason: PauseReason = 'visible'
    paused: boolean
    #listener?: ArgCallback<PauseDetector>

    constructor() {
        this.paused = document?.visibilityState !== 'visible'
        document?.addEventListener('visibilitychange', () => {
            this.paused = document?.visibilityState !== 'visible'
            this.#listener?.(this)
        })
    }

    onPauseChange(listener: ArgCallback<PauseDetector>): void {
        this.#listener = listener
    }

}

export default DocVisibleDetector