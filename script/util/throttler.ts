export default class Throttler {
    private tokens: number
    private listRefillTs: number

    constructor(private readonly capacity: number, private readonly refillRate: number) {
        if (capacity <= 0) throw new Error('Capacity must be positive')
        if (refillRate <= 0) throw new Error('Refill rate must be positive')
        this.tokens = capacity
        this.listRefillTs = Date.now() / 1000
    }

    #refill(): void {
        const now = Date.now() / 1000
        const elapsed = now - this.listRefillTs
        if (elapsed > 0) {
            const added = elapsed * this.refillRate
            this.tokens = Math.min(this.capacity, this.tokens + added)
            this.listRefillTs = now
        }
    }

    public async acquire(count: number = 1): Promise<void> {
        if (count <= 0) return

        while (true) {
            this.#refill()

            if (this.tokens >= count) {
                this.tokens -= count
                return
            }

            const deficit = count - this.tokens
            const waitSeconds = deficit / this.refillRate

            const waitMs = Math.ceil(waitSeconds * 1000) + 10

            await new Promise(resolve => setTimeout(resolve, waitMs))
        }
    }
}