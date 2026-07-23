import type { LimitReason } from '../types'

class DelayCoordinator {
    #handlers: Map<tt4b.limit.ReasonType, Set<NoArgCallback>> = new Map()

    process(reason: LimitReason) {
        const handlers = this.#handlers.get(reason.type)
        handlers?.forEach(h => h())
    }

    register(handler: NoArgCallback, ...types: tt4b.limit.ReasonType[]): void {
        types.forEach(type => {
            const handlers = this.#handlers.get(type) ?? new Set<NoArgCallback>()
            handlers.add(handler)
            this.#handlers.set(type, handlers)
        })
    }
}

export default DelayCoordinator