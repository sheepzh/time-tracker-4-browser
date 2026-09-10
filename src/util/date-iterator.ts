/**
 * Copyright (c) 2023-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { MILL_PER_DAY, formatTimeYMD, isSameDay } from "./time"

/**
 * Iterate from the {@param start} to the {@param end}
 */
export default class DateIterator implements IterableIterator<string> {
    constructor(private cursor: Date, private end: Date) { }

    next(): IteratorResult<string> {
        if (this.cursor > this.end && !isSameDay(this.cursor, this.end)) {
            return { done: true, value: undefined }
        }
        const value = formatTimeYMD(this.cursor)
        this.cursor = new Date(this.cursor.getTime() + MILL_PER_DAY)
        return { done: false, value }
    }

    [Symbol.iterator](): this { return this }
}