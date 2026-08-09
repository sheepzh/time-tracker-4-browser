import type { PauseDetector } from '../types'

abstract class BasePauseDetector implements PauseDetector {
    abstract paused: boolean
    #pauseListener?: NoArgCallback

    onPauseChange(listener: NoArgCallback) {
        this.#pauseListener = listener
    }

    protected notify() {
        this.#pauseListener?.()
    }
}

export default BasePauseDetector