import { MILL_PER_MINUTE, MILL_PER_SECOND } from '@util/time'
import type { CountdownData, Dimension, RemainingData, RemainingItem } from './types'

const ALL_DIMENSIONS: Dimension[] = ['daily', 'weekly', 'visit']

export class CountdownState {
    delayDuration: number = 0
    #delayCount: number = 0
    #rules: tt4b.limit.Item[] = []
    #visitMills: number = 0
    #activeMills: number = 0

    /**
     * Calculate the milliseconds of each dimension
     */
    readonly #dimStrategy: Record<Dimension, (item: tt4b.limit.Item) => [total: number, used: number] | undefined> = {
        daily: ({ time, waste, delayCount }) => {
            if (!time) return undefined
            const total = time * MILL_PER_SECOND
            const used = waste + this.#activeMills - delayCount * this.delayDuration * MILL_PER_MINUTE
            return [total, used]
        },
        weekly: ({ weekly, weeklyWaste: waste, weeklyDelayCount: delayCount }) => {
            if (!weekly) return undefined
            const total = weekly * MILL_PER_SECOND
            const used = waste + this.#activeMills - delayCount * this.delayDuration * MILL_PER_MINUTE
            return [total, used]
        },
        visit: ({ visitTime }) => {
            if (!visitTime) return undefined
            const used = Math.max(0, this.#visitMills - this.#delayCount * this.delayDuration * MILL_PER_MINUTE)
            return [visitTime * MILL_PER_SECOND, used]
        },
    }

    set rules(rules: tt4b.limit.Item[]) {
        this.#rules = rules
        this.#activeMills = 0
        this.#delayCount = 0
    }

    set visitTime(val: number) {
        this.#visitMills = val
    }

    incDelayCount() {
        this.#delayCount++
    }

    addActiveTime(mills: number) {
        this.#activeMills += mills
    }

    resetTime() {
        this.#activeMills = 0
        this.#visitMills = 0
        this.#delayCount = 0
    }

    get data(): CountdownData | undefined {
        const all: RemainingData[] = []
        let targetData: RemainingData | undefined
        let targetItem: RemainingItem | undefined
        let minRemaining: number = Number.MAX_SAFE_INTEGER

        this.#rules.forEach(item => {
            const { id: ruleId, name: ruleName } = item
            const items: RemainingItem[] = []
            ALL_DIMENSIONS.forEach(dimension => {
                const data = this.#dimStrategy[dimension](item)
                if (!data) return
                const [total, used] = data
                const remaining = Math.max(0, total - used)
                items.push({ remaining, total, dimension })
            })
            if (!items.length) return
            const data: RemainingData = { ruleId, ruleName, items }
            items.sort((a, b) => a.remaining - b.remaining)
            const first = items[0]
            if (first && first.remaining < minRemaining) {
                targetData = data
                targetItem = first
                minRemaining = first.remaining
            }
            all.push({ ruleId, ruleName, items })
        })

        if (!targetItem || !targetData) return undefined
        const { ruleId, ruleName } = targetData
        return { target: { ruleId, ruleName, ...targetItem }, all }
    }
}