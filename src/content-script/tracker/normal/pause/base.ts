import { PauseDetector, PauseReason } from '../types'

abstract class BasePauseDetector implements PauseDetector {
    abstract reason: PauseReason
    abstract paused: boolean
    #pauseListener?: ArgCallback<PauseDetector>

    onPauseChange(listener: ArgCallback<PauseDetector>) {
        this.#pauseListener = listener
    }

    protected notify() {
        this.#pauseListener?.(this)
    }
}

export default BasePauseDetector