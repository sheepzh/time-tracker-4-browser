import { MILL_PER_MINUTE } from '@util/time'
import { CountdownData, Dimension, RemainingItem, TIMER_INTERVAL } from './common'

const ALL_DIMENSIONS: Dimension[] = ['daily', 'weekly', 'visit']

export class CountdownModel {
    enabled: boolean = false
    limited: boolean = false
    delayDuration: number = 0
    #rules: tt4b.limit.Item[] = []
    #visitMills: number = 0
    #activeMills: number = 0
    #delayCount: number = 0

    #dimStrategy: Record<Dimension, (item: tt4b.limit.Item) => [total: number, used: number] | undefined> = {
        daily: ({ time: total, waste, delayCount }) => {
            if (!total) return undefined
            const used = waste + this.#activeMills - delayCount * this.delayDuration * MILL_PER_MINUTE
            return [total, used]
        },
        weekly: ({ weekly: total, weeklyWaste: waste, weeklyDelayCount: delayCount }) => {
            if (!total) return undefined
            const used = waste + this.#activeMills - delayCount * this.delayDuration * MILL_PER_MINUTE
            return [total, used]
        },
        visit: ({ visitTime: total }) => total ? [total, this.#visitMills] : undefined,
    }

    set rules(rules: tt4b.limit.Item[]) {
        this.#rules = rules
        this.#activeMills = 0
        this.#delayCount = 0
    }

    set visitTime(val: number) {
        this.#visitMills = val
    }

    onDelay() {
        this.#delayCount++
    }

    onActiveTick() {
        this.#activeMills += TIMER_INTERVAL
    }

    resetTime() {
        this.#activeMills = 0
        this.#visitMills = 0
        this.#delayCount = 0
    }

    get data(): CountdownData | undefined {
        const all: RemainingItem[] = []
        this.#rules.forEach(item => {
            const name = item.name
            ALL_DIMENSIONS.forEach(dimension => {
                const data = this.#dimStrategy[dimension](item)
                if (!data) return
                const [total, used] = data
                const remaining = Math.max(0, total - used)
                all.push({ remaining, total, dimension, name })
            })
        })

        if (!all.length) return undefined

        all.sort((a, b) => a.remaining - b.remaining)
        const shortest = all[0]
        return shortest && { ...shortest, all }
    }
}