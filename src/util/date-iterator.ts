/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type StatDay from '@/shared/day'

/**
 * Iterate from the {@param start} to the {@param end}
 */
export default class DateIterator<T> implements IterableIterator<T> {
    private constructor(private start: StatDay, private end: StatDay, private converter: (date: StatDay) => T) { }

    static of(start: StatDay, end: StatDay): DateIterator<string>
    static of<T>(start: StatDay, end: StatDay, converter: (date: StatDay) => T): DateIterator<T>
    static of(start: StatDay, end: StatDay, converter?: (date: StatDay) => any): IterableIterator<any> {
        return new DateIterator(start, end, converter ?? (d => d.toString()))
    }

    next(): IteratorResult<T> {
        if (this.start > this.end) {
            return { done: true, value: undefined }
        }
        const value = this.converter(this.start)
        this.start = this.start.next()
        return { done: false, value }
    }

    [Symbol.iterator](): this { return this }
}