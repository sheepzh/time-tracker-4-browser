/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

export function formatTimeYMD(time: Date | number): string {
    time = new Date(time)
    const y = time.getFullYear()
    const m = time.getMonth() + 1
    const d = time.getDate()
    return `${String(y).padStart(4, '0')}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`
}

export const MILL_PER_SECOND = 1000

export const MILL_PER_MINUTE = MILL_PER_SECOND * 60

export const MILL_PER_HOUR = MILL_PER_MINUTE * 60

export function isSameDay(a: Date | number, b: Date | number): boolean {
    a = typeof a === 'number' ? new Date(a) : a
    b = typeof b === 'number' ? new Date(b) : b
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
}

/**
 * @returns 0 to 6, means Monday to Sunday
 */
export function getWeekDay(date: Date): number {
    return (date.getDay() + 6) % 7
}

export function getWeekStartTime(now: number | Date, weekStart: number): number {
    const date = new Date(now)
    const delta = (getWeekDay(date) - weekStart + 7) % 7
    date.setDate(date.getDate() - delta)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
}

/**
 * Get the start time of the next day (local midnight)
 *
 * @param target the specific time
 * @returns the start of the next day, in milliseconds
 */
export function getStartOfNextDay(target: Date | number): number {
    const date = new Date(target)
    date.setDate(date.getDate() + 1)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
}

export const BIRTHDAY_STR = '20210303'
export const BIRTHDAY = new Date(2021, 2, 3, 0, 0, 0, 0)

export function addDays(date: Date | number, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

/**
 * yyyyMMdd => Date
 */
export function parseTime(dateStr: string): Date
export function parseTime(dateStr: string | undefined): Date | undefined
export function parseTime(dateStr: string | undefined): Date | undefined {
    if (dateStr === undefined) return undefined
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6))
    const date = parseInt(dateStr.substring(6, 8))
    return new Date(year, month - 1, date)
}

export type DateRange = Date | [Date?, Date?] | undefined

export const cvtDateRange2Str = (range: DateRange | [number?, number?]): [string?, string?] | undefined => {
    if (!range) return undefined
    if (range instanceof Date) {
        // The same day
        const date = formatTimeYMD(range)
        return [date, date]
    }
    const [start, end] = range
    const startStr = start ? formatTimeYMD(start) : undefined
    const endStr = end ? formatTimeYMD(end) : undefined
    return [startStr, endStr]
}

export const cvt2Time = (data: unknown): number | undefined => {
    if (data === undefined || data === null) return undefined
    if (typeof data === 'number') return data
    if (data instanceof Date) return data.getTime()
    return undefined
}