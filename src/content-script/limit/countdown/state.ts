import { calcRealLimit } from '@util/limit'
import { MILL_PER_SECOND } from '@util/time'
import type { SharedOption, VisitData } from '../types'
import type { CountdownData, Dimension, RemainingData, RemainingItem } from './types'

const ALL_DIMENSIONS: Dimension[] = ['daily', 'weekly', 'visit']

export class CountdownState {
    #rules: tt4b.limit.Item[] = []
    #activeMills: number = 0
    #lastVisitMills: number = 0

    constructor(private readonly option: Readonly<SharedOption>, private readonly visit: VisitData) { }

    readonly #dimStrategy: Record<Dimension, (item: tt4b.limit.Item) => [limitSec: number | undefined, usedMill: number, delayCount: number]> = {
        daily: ({ time, waste, delayCount }) => [time, waste + this.#activeMills, delayCount],
        weekly: ({ weekly, weeklyWaste, weeklyDelayCount }) => [weekly, weeklyWaste + this.#activeMills, weeklyDelayCount],
        visit: ({ visitTime }) => [visitTime, this.visit.mills, this.visit.delayCount],
    }

    set rules(rules: tt4b.limit.Item[]) {
        this.#rules = rules
        this.#activeMills = 0
    }

    syncActiveTime() {
        const { mills } = this.visit
        const delta = mills - this.#lastVisitMills
        delta > 0 && (this.#activeMills += delta)
        this.#lastVisitMills = mills
    }

    get data(): CountdownData | undefined {
        const all: RemainingData[] = []
        let target: RemainingItem | undefined

        this.#rules.forEach(rule => {
            const items = this.#calcItems(rule)
            if (!items.length) return
            all.push({ ruleName: rule.name, items })
            const [first] = items
            first && (!target || first.remaining < target.remaining) && (target = first)
        })

        return target ? { target, all } : undefined
    }

    #calcItems(rule: tt4b.limit.Item): RemainingItem[] {
        return ALL_DIMENSIONS
            .map(dimension => this.#calcItem(rule, dimension))
            .filter(item => !!item)
            .sort((a, b) => a.remaining - b.remaining)
    }

    #calcItem(rule: tt4b.limit.Item, dimension: Dimension): RemainingItem | undefined {
        const [limitSec, usedMill, delayCount] = this.#dimStrategy[dimension](rule)
        if (!limitSec) return undefined
        const delay = { count: delayCount, duration: this.option.delayDuration, allow: rule.allowDelay }
        const total = calcRealLimit(limitSec * MILL_PER_SECOND, delay)
        return { dimension, total, remaining: Math.max(0, total - usedMill) }
    }
}