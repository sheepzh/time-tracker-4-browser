import { locale } from "@i18n"
import { getStartOfDay, getWeekDay, MILL_PER_DAY } from "@util/time"
import optionHolder from './option-holder'

function getDefaultWeekStart(localeOpt: timer.option.LocaleOption): number {
    const parts = navigator.language.split(/[-_]/)
    const region = parts[parts.length - 1]?.toLowerCase() ?? ''
    switch (locale) {
        // Only Venezuela uses Sunday as the first day of week
        case 'es': return 've' === region ? 6 : 0
        // Lebanon, Morocco and Tunisia use Monday as the first day of week
        case 'ar': return ['la', 'ma', 'tn'].includes(region) ? 0 : 6
        // Other countries or fallbacked to English use Monday as the first day of week
        case 'en':
            if (['us', 'ca', 'in', 'za', 'jm', 'ph'].includes(region)) {
                // US, Canaca, India, South Africa, Jamaica, Philippines use Sunday as the first day of week 
                return 6
            } else if (['gb', 'au', 'nz'].includes(region)) {
                // UK, Australia and New Zealand use Monday as the first day of week
                return 0
            } else if (localeOpt === 'en') {
                // If locale option is set to English by user, use Sunday as the first day of week
                return 6
            } else {
                // FALLBACK
                return 0
            }
        case 'ja':
        case 'pt_PT':
        // Taiwan, Hong Kong and Macau use Sunday as the first day of week
        case 'zh_TW': return 6
        case 'zh_CN':
        case 'uk':
        case 'de':
        case 'fr':
        case 'ru':
        case 'tr':
        case 'pl':
        case 'it': return 0
    }
}

/**
 * Week start
 *
 * @returns 0-6
 */
export async function getWeekStartDay(): Promise<number> {
    const { weekStart, locale: localeOpt } = await optionHolder.get()
    return weekStart === 'default' ? getDefaultWeekStart(localeOpt) : weekStart - 1
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