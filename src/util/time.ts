/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isRtl } from "./document"

/**
 * Copyright (c) 2017-present PanJiaChen
 *
 * This function is released under the MIT License.
 * https://opensource.org/licenses/MIT
 *
 * Created by PanJiaChen on 16/11/18.
 * @see https://github.com/PanJiaChen/vue-element-admin/blob/HEAD/src/utils/index.js
 *
 * Parse the time to string
 */
export function formatTime(time: Date | string | number, cFormat?: string) {
    const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
    let date: Date
    if (time instanceof Date) {
        date = time
    } else {
        if ((typeof time === 'string')) {
            if ((/^[0-9]+$/.test(time))) {
                // support "1548221490638"
                time = parseInt(time)
            } else {
                // support safari
                time = time.replace(new RegExp(/-/gm), '/')
            }
        }

        if ((typeof time === 'number') && (time.toString().length === 10)) {
            time = time * 1000
        }
        date = new Date(time)
    }
    const formatObj: Record<string, number> = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay()
    }
    const timeStr = format.replace(/{([ymdhisa])+}/g, (_result, key) => {
        const value = formatObj[key]
        // Note: getDay() returns 0 on Sunday
        if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value] }
        return value.toString().padStart(2, '0')
    })
    return timeStr
}

export function formatTimeYMD(time: Date | string | number) {
    return formatTime(time, '{y}{m}{d}')
}

/**
 * Format milliseconds for display
 */
export function formatPeriod(milliseconds: number, message: Record<'dayMsg' | 'hourMsg' | 'minuteMsg' | 'secondMsg', string>): string {
    const prefix = milliseconds < 0 ? '-' : ''
    milliseconds = Math.abs(milliseconds)
    const { dayMsg, hourMsg, minuteMsg, secondMsg } = message
    const seconds = Math.floor(milliseconds / 1000)
    const day = Math.floor(seconds / 86400)
    const hour = Math.floor(seconds / 3600 - day * 24)
    const minute = Math.floor(seconds / 60 - (day * 24 + hour) * 60)
    const second = seconds - day * 86400 - hour * 3600 - minute * 60

    let msg = dayMsg
    if (!day) {
        msg = hourMsg
        if (!hour) {
            msg = minuteMsg
            if (!minute) {
                msg = secondMsg
            }
        }
    }
    const result = msg
        .replace('{day}', day.toString())
        .replace('{hour}', hour.toString())
        .replace('{minute}', minute.toString())
        .replace('{second}', second.toString())
    return prefix + result
}

/**
 * e.g.
 *
 * 100h0m0s
 * 20h10m59s
 * 20h0m1s
 * 10m20s
 * 30s
 *
 * @return (xx+h)(xx+m)xx+s
 */
export function formatPeriodCommon(milliseconds: number): string {
    const defaultMessage = isRtl() ? {
        dayMsg: 's{second} m{minute} h{hour} d',
        hourMsg: 's{second} m{minute} h{hour}',
        minuteMsg: 's{second} m{minute}',
        secondMsg: 's{second}',
    } : {
        dayMsg: '{day}d {hour}h {minute}m {second}s',
        hourMsg: '{hour}h {minute}m {second}s',
        minuteMsg: '{minute}m {second}s',
        secondMsg: '{second}s',
    }
    return formatPeriod(milliseconds, defaultMessage)
}

export const MILL_PER_SECOND = 1000

export const MILL_PER_MINUTE = MILL_PER_SECOND * 60

export const MILL_PER_HOUR = MILL_PER_MINUTE * 60

/**
 * Milliseconds per day
 *
 * @since 0.0.8
 */
export const MILL_PER_DAY = MILL_PER_HOUR * 24

export const MILL_PER_WEEK = MILL_PER_DAY * 7

/**
 * Date range between {start} days ago and {end} days ago
 */
export const daysAgo = (start: number, end: number): [Date, Date] => {
    const current = new Date().getTime()
    return [new Date(current - start * MILL_PER_DAY), new Date(current - end * MILL_PER_DAY)]
}

export function isSameDay(a: Date, b: Date): boolean {
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

/**
 * Get the start time and end time of this month
 *
 * @param target the specific time
 * @returns [startTime, endTime]
 *
 * @since 0.6.0
 */
export function getMonthTime(target: Date): [Date, Date] {
    const currentMonth = target.getMonth()
    const currentYear = target.getFullYear()
    const start = new Date(currentYear, currentMonth, 1)
    const endTime = new Date(currentYear, currentMonth + 1, 1).getTime()
    const end = new Date(endTime - 1)
    return [start, end]
}

/**
 * Get the start time of this day
 *
 * @param target the specific time
 * @returns the start of this day
 * @since 1.0.0
 */
export function getStartOfDay(target: Date | number) {
    const date = new Date(target)
    date.setHours(0, 0, 0, 0)
    return date
}

/**
 * The birthday of this extension
 *
 * @since 1.2.0
 */
export function getBirthday(): Date {
    const date = new Date()
    // 2022-03-03
    date.setFullYear(2021)
    date.setMonth(2)
    date.setDate(3)
    date.setHours(0, 0, 0, 0)
    return date
}
export const BIRTHDAY = '20220303'

/**
 * Calc the day length
 * @returns
 *  1 if 2022-06-09 00:00:00 to 2022-06-09 00:00:01
 *  0 if 2022-06-10 00:00:00 to 2022-06-09 00:00:01
 *  2 if 2022-11-10 08:00:00 to 2022-11-11 00:00:01
 */
export function getDayLength(dateStart: Date, dateEnd: Date): number {
    let cursor = new Date(dateStart)
    let dateDiff = 0
    do {
        dateDiff += 1
        cursor = new Date(cursor.getTime() + MILL_PER_DAY)
    } while (cursor.getTime() < dateEnd.getTime())
    isSameDay(cursor, dateEnd) && dateDiff++
    return dateDiff
}

/**
 * Calc the dates between {@param dateStart} and {@param dateEnd}
 *
 * @returns
 *  [20220609]              if 2022-06-09 00:00:00 to 2022-06-09 00:00:01
 *  []                      if 2022-06-10 00:00:00 to 2022-06-09 00:00:01
 *  [20221110, 20221111]    if 2022-11-10 08:00:00 to 2022-11-11 00:00:01
 */
export function getAllDatesBetween(dateStart: Date, dateEnd: Date, formatter?: Converter<Date, string>): string[] {
    let cursor = new Date(dateStart)
    let dates: string[] = []
    formatter = formatter ?? formatTimeYMD
    do {
        dates.push(formatter(cursor))
        cursor = new Date(cursor.getTime() + MILL_PER_DAY)
    } while (cursor.getTime() < dateEnd.getTime())
    isSameDay(cursor, dateEnd) && dates.push(formatter(dateEnd))
    return dates
}

/**
 * yyyyMMdd => Date
 */
export function parseTime(dateStr: string | undefined): Date | undefined {
    if (!dateStr) return undefined
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6))
    const date = parseInt(dateStr.substring(6, 8))
    const result = new Date()
    result.setFullYear(year)
    result.setMonth(month - 1)
    result.setDate(date)
    return result
}
