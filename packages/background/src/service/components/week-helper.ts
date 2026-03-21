import optionHolder from '@/background/service/components/option-holder'
import { locale } from "@i18n"
import { formatTimeYMD, getWeekDay, MILL_PER_DAY } from "@util/time"

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
function getWeekTime(now: Date, weekStart: number): [Date, Date] {
    // Returns 0 - 6 means Monday to Sunday
    const weekDayNow = getWeekDay(now)
    let start: Date | undefined = undefined
    if (weekDayNow === weekStart) {
        start = now
    } else if (weekDayNow < weekStart) {
        const millDelta = (weekDayNow + 7 - weekStart) * MILL_PER_DAY
        start = new Date(now.getTime() - millDelta)
    } else {
        const millDelta = (weekDayNow - weekStart) * MILL_PER_DAY
        start = new Date(now.getTime() - millDelta)
    }
    return [start, now]
}

class WeekHelper {

    async getWeekDateRange(now: Date): Promise<[startDate: string, endDateOrToday: string]> {
        const [start, end] = await this.getWeekDate(now)
        return [formatTimeYMD(start), formatTimeYMD(end)]
    }

    async getWeekDate(now: Date | number): Promise<[start: Date, end: Date]> {
        const weekStart = await this.getRealWeekStart()
        return getWeekTime(typeof now === 'number' ? new Date(now) : now, weekStart)
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