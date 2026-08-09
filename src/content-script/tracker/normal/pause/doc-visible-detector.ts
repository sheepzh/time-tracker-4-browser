import type { PauseDetector } from '../types'
import BasePauseDetector from './base'

class DocVisibleDetector extends BasePauseDetector implements PauseDetector {
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