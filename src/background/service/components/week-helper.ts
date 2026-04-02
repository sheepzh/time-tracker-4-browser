import { locale } from "@i18n"
import { getStartOfDay, getWeekDay, MILL_PER_DAY } from "@util/time"
import optionHolder from './option-holder'

/**
 * Week start
 *
 * @returns 0-6
 */
export async function getWeekStartDay(): Promise<number> {
    const { weekStart } = await optionHolder.get()
    if (weekStart === 'default') {
        return locale === 'zh_CN' ? 0 : 6
    } else {
        return weekStart - 1
    }
}

/**
 * Get the start time and end time of this week
 * 
 * @param now the specific time to calculate
 * @returns start time with milliseconds
 *
 * @since 0.6.0
 */
export async function getWeekStartTime(now: number): Promise<number> {
    const weekStart = await getWeekStartDay()
    // Returns 0 - 6 means Monday to Sunday
    const weekDayNow = getWeekDay(new Date(now))
    let startDay: number
    if (weekDayNow === weekStart) {
        startDay = now
    } else if (weekDayNow < weekStart) {
        const millDelta = (weekDayNow + 7 - weekStart) * MILL_PER_DAY
        startDay = now - millDelta
    } else {
        const millDelta = (weekDayNow - weekStart) * MILL_PER_DAY
        startDay = now - millDelta
    }
    return getStartOfDay(startDay)
}