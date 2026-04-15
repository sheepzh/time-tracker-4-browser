import optionDatabase from "@db/option-database"
import { locale } from "@i18n"
import { formatTimeYMD, getWeekDay, MILL_PER_DAY } from "@util/time"

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
 * Get the real week start according to the option
 * 
 * @param weekStart option value
 * @returns 0-6
 */
function getRealWeekStart(option: timer.option.AllOption): number {
    const { weekStart = 'default', locale: localeOpt } = option
    return weekStart === 'default' ? getDefaultWeekStart(localeOpt) : weekStart - 1
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
    private option: timer.option.AllOption | undefined

    private async checkInit(): Promise<timer.option.AllOption> {
        if (this.option) return this.option
        const option = await optionDatabase.getOption()
        optionDatabase.addOptionChangeListener(opt => this.option = opt)
        this.option = option
        return option
    }

    async getWeekDateRange(now: Date): Promise<[startDate: string, endDateOrToday: string]> {
        const [start, end] = await this.getWeekDate(now)
        return [formatTimeYMD(start), formatTimeYMD(end)]
    }

    async getWeekDate(now: Date | number): Promise<[start: Date, end: Date]> {
        const weekStart = await this.getRealWeekStart()
        return getWeekTime(typeof now === 'number' ? new Date(now) : now, weekStart)
    }

    /**
     * Week start
     *
     * @returns 0-6
     */
    async getRealWeekStart(): Promise<number> {
        const option = await this.checkInit()
        return getRealWeekStart(option)
    }
}

export default new WeekHelper()