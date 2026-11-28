/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { StatDay, StatRange } from '@/shared/day'

/**
 * Iterate from the {@param start} to the {@param end}
 */
export default class DateIterator<T> implements IterableIterator<T> {
    private constructor(private start: StatDay, private end: StatDay, private converter: (date: StatDay) => T) { }

    static of(range: StatRange): DateIterator<string>
    static of<T>(range: StatRange, converter: Converter<StatDay, T>): DateIterator<T>
    static of(range: StatRange, converter?: Converter<StatDay, any>): IterableIterator<any> {
        return new DateIterator(range.start, range.end, converter ?? (d => d.toString()))
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