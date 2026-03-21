/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const DEFAULT_THRESHOLD = 10

/**
 * FIFO cache
 */
class FIFOCache<T> {
    keyQueue: string[] = []
    threshold: number
    map: Record<string, T> = {}

    constructor(threshold?: number) {
        if (!threshold) {
            threshold = DEFAULT_THRESHOLD
        } else if (!Number.isInteger(threshold)) {
            throw new Error('Threshold MUST BE integer')
        } else if (threshold <= 0) {
            threshold = DEFAULT_THRESHOLD
        }
        this.threshold = threshold
    }

    async set(key: string, value: T) {
        if (!key || !value) return
        const hasKey = this.map[key]
        this.map[key] = value
        if (!hasKey) {
            // New key
            this.keyQueue.push(key)
            const length = this.keyQueue.length
            if (length > this.threshold) {
                const deleted = this.keyQueue.slice(0, length - this.threshold)
                deleted.forEach(key => delete this.map[key])
            }
        }
    }

    get(origin: string): T | undefined {
        return this.map[origin]
    }

    async getOrSupply(key: string, supplier: () => PromiseLike<T>): Promise<T> {
        const exist = this.map[key]
        if (exist) {
            return exist
        }
        const value = await supplier()
        this.set(key, value)
        return value
    }

    clear() {
        this.keyQueue = []
        this.map = {}
    }

    size() {
        return this.keyQueue.length
    }
}

export default FIFOCache