/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * Iterate from the {@param start} to the {@param end}
 */
export default class MonthIterator implements IterableIterator<string> {
    #cursor: [number, number]
    #end: [number, number]

    constructor(start: Date, end: Date) {
        this.#cursor = [start.getFullYear(), start.getMonth()]
        this.#end = [end.getFullYear(), end.getMonth()]
    }

    next(): IteratorResult<string> {
        const [year, month] = this.#cursor
        if (year > this.#end[0] || (year === this.#end[0] && month > this.#end[1])) {
            return { done: true, value: undefined }
        }
        const value = String(year).padStart(4, '0') + String(month + 1).padStart(2, '0')
        const next = month + 1
        this.#cursor = [year + (next >= 12 ? 1 : 0), next % 12]
        return { done: false, value }
    }

    [Symbol.iterator](): this { return this }
}