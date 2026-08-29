import BasePauseDetector from '@cs/tracker/normal/pause/base'
import { isSameReason } from '../common'
import type { Reason, ReasonType } from '../types'

const TYPE_SORT: Record<ReasonType, number> = {
    FOCUS: -1,
    PERIOD: 0,
    VISIT: 1,
    DAILY: 2,
    WEEKLY: 3,
}

class LimitState extends BasePauseDetector {
    #items: Reason[] = []
    #listeners: ArgCallback<Reason | undefined>[] = []

    get reasons() {
        return this.#items
    }

    get #current() {
        return this.#items[0]
    }

    get paused() {
        return !!this.#items.length
    }

    onChange(listener: ArgCallback<Reason | undefined>) {
        this.#listeners.push(listener)
        listener(this.#current)
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
        const curr = this.#current
        this.#listeners.forEach(l => l(curr))
        super.notify()
    }
}

export default LimitState