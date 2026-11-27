/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { StatDay } from '@/shared/day'

export const pad = (n: number, len = 2) => n.toString().padStart(len, '0')

export const MILL_PER_SECOND = 1000
export const MILL_PER_MINUTE = MILL_PER_SECOND * 60
export const MILL_PER_HOUR = MILL_PER_MINUTE * 60

/**
 * Get the start time of the next day (local midnight)
 *
 * @param target the specific time
 * @returns the start of the next day, in milliseconds
 */
export function getStartOfNextDay(target: Date | number): number {
    const date = new Date(target)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime()
}

export const BIRTHDAY_STR = '20210303'
export const BIRTHDAY = new Date(2021, 2, 3, 0, 0, 0, 0)
export const BIRTH_DATE = StatDay.ofLabel(BIRTHDAY)

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
