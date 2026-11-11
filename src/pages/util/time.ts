import { getWeekStartDay } from '@api/sw/option'
import { dateFmt, fmtDuration, tWeekDays, unitFmt } from '@i18n'
import { rotate } from '@util/array'
import { addDays, formatTimeYMD, MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND, parseTime } from '@util/time'

export {
    addDays, BIRTHDAY, BIRTHDAY_STR, cvt2Time, cvtDateRange2Str, formatTimeYMD, getStartOfNextDay, getWeekDay,
    getWeekStartTime, isSameDay, MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND, parseTime, type DateRange
} from '@util/time'

type DurFormatOption = {
    format?: tt4b.ui.TimeFormat | 'auto'
    hideUnit?: boolean
}

const UNIT_MAP: { [unit in Exclude<tt4b.ui.TimeFormat, 'default'>]
    : [timeConversion: number, fraction: number, unit: Parameters<typeof unitFmt>[0]] } = {
    second: [MILL_PER_SECOND, 0, "second"],
    minute: [MILL_PER_MINUTE, 1, "minute"],
    hour: [MILL_PER_HOUR, 2, "hour"],
}

export function fmtDur(milliseconds: number | undefined | null, option?: DurFormatOption): string {
    if (typeof milliseconds !== 'number' || Number.isNaN(milliseconds) || !Number.isFinite(milliseconds)) {
        return "-"
    }
    let { format = 'default', hideUnit } = option ?? {}
    if (format === 'default') return fmtDuration(milliseconds)
    if (format === 'auto') {
        if (milliseconds < MILL_PER_MINUTE) format = 'second'
        else if (milliseconds < MILL_PER_HOUR) format = 'minute'
        else format = 'hour'
    }
    const [conversion, fraction, unit] = UNIT_MAP[format]
    const val = milliseconds / conversion
    if (hideUnit) return val.toFixed(fraction)
    return unitFmt(unit, fraction).format(val)
}

type DateLike = string | Date | number

const parseDateLike = (like?: DateLike) => typeof like === 'string' ? parseTime(like) : like

export const cvt2LocaleDate = (startLike?: DateLike, endLike?: DateLike): string => {
    const start = parseDateLike(startLike)
    const end = parseDateLike(endLike)
    if (start === undefined) return '-'
    const fmt = dateFmt()
    return end === undefined ? fmt.format(start) : fmt.formatRange(start, end)
}

export async function getWeekDays() {
    const weekStart = await getWeekStartDay()
    const weekDays = tWeekDays().reverse()
    rotate(weekDays, weekStart)
    return weekDays
}

/**
 * Date range between {start} days ago and {end} days ago
 */
export const daysAgo = (start: number, end: number): [Date, Date] => {
    const current = new Date().getTime()
    return [addDays(current, -start), addDays(current, -end)]
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
 * @returns the start of this day, in milliseconds
 *
 * @since 1.0.0
 */
export function getStartOfDay(target: Date | number): number {
    const date = new Date(target)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
}

/**
 * Calc the day length
 * @returns
 *  1 if 2022-06-09 00:00:00 to 2022-06-09 00:00:01
 *  0 if 2022-06-10 00:00:00 to 2022-06-09 00:00:01
 *  2 if 2022-11-10 08:00:00 to 2022-11-11 00:00:01
 */
export function getDayLength(start: Date | number, end: Date | number): number {
    const d1 = new Date(start)
    const d2 = new Date(end)

    if (d1 > d2) return 0

    d1.setUTCFullYear(d1.getFullYear(), d1.getMonth(), d1.getDate())
    d2.setUTCFullYear(d2.getFullYear(), d2.getMonth(), d2.getDate())
    d1.setUTCHours(0, 0, 0, 0)
    d2.setUTCHours(0, 0, 0, 0)

    return (d2.getTime() - d1.getTime()) / (MILL_PER_HOUR * 24) + 1
}

/**
 * Calc the dates between {@param dateStart} and {@param dateEnd}
 *
 * @returns
 *  [20220609]              if 2022-06-09 00:00:00 to 2022-06-09 00:00:01
 *  []                      if 2022-06-10 00:00:00 to 2022-06-09 00:00:01
 *  [20221110, 20221111]    if 2022-11-10 08:00:00 to 2022-11-11 00:00:01
 */
export function getAllDatesBetween(start: Date | number, end: Date | number, formatter?: Converter<Date, string>): string[] {
    const current = new Date(start)
    const target = new Date(end)

    if (current > target) return []

    current.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)

    const dates: string[] = []
    const fmt = formatter ?? formatTimeYMD

    while (current <= target) {
        dates.push(fmt(current))
        current.setDate(current.getDate() + 1)
    }

    return dates
}