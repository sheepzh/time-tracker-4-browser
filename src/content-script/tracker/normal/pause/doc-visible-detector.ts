import type { PauseDetector, PauseReason } from '../types'
import BasePauseDetector from './base'

class DocVisibleDetector extends BasePauseDetector implements PauseDetector {
    reason: PauseReason = 'visible'
    paused: boolean

    constructor() {
        super()
        this.paused = document?.visibilityState !== 'visible'
        document?.addEventListener('visibilitychange', () => {
            this.paused = document?.visibilityState !== 'visible'
            this.notify()
        })
    }
}

export default DocVisibleDetector