import type { PauseDetector, PauseReason } from '@cs/tracker/normal/types'
import { isSameReason } from '../common'
import type { Reason, ReasonType } from '../types'

const TYPE_SORT: Record<ReasonType, number> = {
    FOCUS: -1,
    PERIOD: 0,
    VISIT: 1,
    DAILY: 2,
    WEEKLY: 3,
}

class LimitState implements PauseDetector {
    reason: PauseReason = 'limit'
    #items: Reason[] = []
    #listener?: ArgCallback<Reason | undefined>
    #pauseListener?: ArgCallback<PauseDetector>

    get reasons() {
        return this.#items
    }

    get paused() {
        return !!this.#items.length
    }

    onChange(listener: ArgCallback<Reason | undefined>) {
        this.#listener = listener
        this.#notify()
    }

    onPauseChange(listener: ArgCallback<PauseDetector>) {
        this.#pauseListener = listener
    }

    add(...reasons: Reason[]): void {
        const filtered = reasons.filter(r => !this.#items.some(item => isSameReason(item, r)))
        if (!filtered.length) return
        this.#items.push(...filtered)
        this.#items.sort((a, b) => TYPE_SORT[a.type] - TYPE_SORT[b.type])
        this.#notify()
    }

    remove(...reasons: Reason[]): void {
        if (!reasons.length) return
        this.#items = this.#items.filter(item => !reasons.some(r => isSameReason(item, r)))
        this.#notify()
    }

    removeByType(...types: ReasonType[]): void {
        if (!types.length) return
        this.#items = this.#items.filter(item => !types.includes(item.type))
        this.#notify()
    }

    #notify() {
        this.#listener?.(this.#items[0])
        this.#pauseListener?.(this)
    }
}

export default LimitState