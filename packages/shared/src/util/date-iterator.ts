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
export default class DateIterator {
    cursor: Date
    end: Date

    constructor(start: Date, end: Date) {
        if (!start || !end) {
            throw new Error("Invalid param")
        }
        this.cursor = start
        this.end = end
    }

    hasNext(): boolean {
        if (this.cursor <= this.end) {
            return true
        }
        return isSameDay(this.cursor, this.end)
    }

    next(): IteratorResult<string> {
        if (this.hasNext()) {
            const value = formatTimeYMD(this.cursor)
            this.cursor = new Date(this.cursor.getTime() + MILL_PER_DAY)
            return {
                value,
                done: false,
            }
        } else {
            return {
                value: null,
                done: true,
            }
        }
    }

    forEach(callback: (yearMonthDate: string) => void) {
        while (this.hasNext()) {
            callback(this.next().value)
        }
    }

    toArray(): string[] {
        const result: string[] = []
        this.forEach(yearMonth => result.push(yearMonth))
        return result
    }
}