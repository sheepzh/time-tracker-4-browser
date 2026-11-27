import type { StatRange } from '@/shared/day'
import { StatDay } from '@/shared/day'
import { dateFmt, fmtDuration, tWeekDays, unitFmt } from '@i18n'
import { rotate } from '@util/array'
import { MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND, parseTime } from '@util/time'

export { addDays, BIRTHDAY, BIRTHDAY_STR, getStartOfNextDay, MILL_PER_HOUR, MILL_PER_MINUTE, MILL_PER_SECOND, parseTime } from '@util/time'

type DurFormatOption = {
    format?: tt4b.ui.TimeFormat | 'auto'
    hideUnit?: boolean
}

type UnitConfig = [conversion: number, fraction: number, unit: Parameters<typeof unitFmt>[0]]
const UNIT_MAP: Record<Exclude<tt4b.ui.TimeFormat, 'default'>, UnitConfig> = {
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

type DateLike = string | Date | StatDay | number | Temporal.PlainDate

function parseDateLike(like: DateLike | undefined): Exclude<DateLike, StatDay | string> | undefined {
    if (typeof like === 'string') return parseTime(like)
    if (like instanceof StatDay) return like.toDate()
    return like
}

export function cvt2LocaleDate(startOrRange?: StatRange | DateLike, endLike?: DateLike): string {
    if (!startOrRange) return '-'
    const [start, end] = Array.isArray(startOrRange)
        ? [parseDateLike(startOrRange[0]), parseDateLike(startOrRange[1])]
        : [parseDateLike(startOrRange), parseDateLike(endLike)]
    if (!start) return '-'
    const fmt = dateFmt()
    return end ? fmt.formatRange(start, end) : fmt.format(start)
}

export function getWeekDays(weekStart: tt4b.WeekStart) {
    const weekDays = tWeekDays().reverse()
    rotate(weekDays, weekStart - 1)
    return weekDays
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
