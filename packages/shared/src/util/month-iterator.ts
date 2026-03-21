/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * Iterate from the {@param start} to the {@param end}
 */
export default class MonthIterator {
    cursor: [number, number]
    end: [number, number]

    constructor(start: Date, end: Date) {
        if (!start || !end) {
            throw new Error("Invalid param")
        }
        this.cursor = [start.getFullYear(), start.getMonth()]
        this.end = [end.getFullYear(), end.getMonth()]
    }

    hasNext(): boolean {
        if (this.cursor[0] === this.end[0]) {
            return this.cursor[1] <= this.end[1]
        } else {
            return this.cursor[0] < this.end[0]
        }
    }

    next(): string | undefined {
        if (this.hasNext()) {
            const [year, month] = this.cursor
            const result = year.toString().padStart(4, '0') + (month + 1).toString().padStart(2, '0')
            const nextMonth = month + 1
            this.cursor[0] += nextMonth >= 12 ? 1 : 0
            this.cursor[1] = nextMonth % 12
            return result
        } else {
            return undefined
        }
    }

    forEach(callback: (yearMonth: string) => void) {
        let next: string | undefined = undefined
        while (next = this.next()) {
            callback(next)
        }
    }

    toArray(): string[] {
        const result: string[] = []
        this.forEach(yearMonth => result.push(yearMonth))
        return result
    }
}