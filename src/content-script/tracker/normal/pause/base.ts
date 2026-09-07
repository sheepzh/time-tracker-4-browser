import type { PauseDetector } from '../types'

abstract class BasePauseDetector implements PauseDetector {
    abstract paused: boolean
    #pauseListeners: ArgCallback<boolean>[] = []

    onPauseChange(listener: NoArgCallback) {
        this.#pauseListeners.push(listener)
    }

    protected notify() {
        this.#pauseListeners.forEach(l => l(this.paused))
    }
}

export default BasePauseDetector
