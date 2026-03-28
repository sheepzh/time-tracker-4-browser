import { locale } from "@i18n"
import { formatTimeYMD, getWeekDay, MILL_PER_DAY } from "@util/time"
import optionHolder from './option-holder'

function getRealWeekStart(weekStart: timer.option.WeekStartOption | undefined, locale: timer.Locale): number {
    weekStart = weekStart ?? 'default'
    if (weekStart === 'default') {
        return locale === 'zh_CN' ? 0 : 6
    } else {
        return weekStart - 1
    }
}

/**
 * Get the start time and end time of this week
 * @param now the specific time
 * @param weekStart 0-6
 * @returns [startTime, endTime]
 *
 * @since 0.6.0
 */
function getWeekTime(now: number, weekStart: number): [number, number] {
    // Returns 0 - 6 means Monday to Sunday
    const weekDayNow = getWeekDay(new Date(now))
    let start: number | undefined = undefined
    if (weekDayNow === weekStart) {
        start = now
    } else if (weekDayNow < weekStart) {
        const millDelta = (weekDayNow + 7 - weekStart) * MILL_PER_DAY
        start = now - millDelta
    } else {
        const millDelta = (weekDayNow - weekStart) * MILL_PER_DAY
        start = now - millDelta
    }
    return [start, now]
}

class WeekHelper {

    async getWeekDateRange(now: number): Promise<[startDate: string, endDateOrToday: string]> {
        const { start, end } = await this.getWeekDate(now)
        return [formatTimeYMD(start), formatTimeYMD(end)]
    }

    async getWeekDate(now: number): Promise<{ start: number, end: number }> {
        const weekStart = await this.getRealWeekStart()
        const [start, end] = getWeekTime(now, weekStart)
        return { start, end }
    }

    private async getWeekStartOpt(): Promise<timer.option.WeekStartOption | undefined> {
        return (await optionHolder.get()).weekStart
    }

    /**
     * Week start
     *
     * @returns 0-6
     */
    async getRealWeekStart(): Promise<number> {
        const weekStart = await this.getWeekStartOpt()
        return getRealWeekStart(weekStart, locale)
    }
}

export default new WeekHelper()