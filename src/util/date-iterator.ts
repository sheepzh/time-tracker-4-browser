/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isSameDay } from "./time"

/**
 * Iterate from the {@param start} to the {@param end}
 */
export default class DateIterator<T> implements IterableIterator<T> {
    private constructor(private start: Date, private end: Date, private converter: (date: Date) => T) { }

    static of(start: Date, end: Date): DateIterator<Date>
    static of<T>(start: Date, end: Date, converter: (date: Date) => T): DateIterator<T>
    static of(start: Date, end: Date, converter?: (date: Date) => any): IterableIterator<any> {
        return new DateIterator(start, end, converter ?? (d => d))
    }

    next(): IteratorResult<T> {
        if (this.start > this.end && !isSameDay(this.start, this.end)) {
            return { done: true, value: undefined }
        }
        const value = this.converter(this.start)
        const nextDate = new Date(this.start)
        nextDate.setDate(nextDate.getDate() + 1)
        this.start = nextDate
        return { done: false, value }
    }

    [Symbol.iterator](): this { return this }
}