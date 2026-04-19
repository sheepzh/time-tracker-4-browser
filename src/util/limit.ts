import { EXCLUDING_PREFIX } from './constant/remain-host'
import { getWeekDay, MILL_PER_MINUTE, MILL_PER_SECOND } from "./time"

const matchUrl = (cond: string, url: string): boolean => {
    return new RegExp(`^.*//${cond.split('*').join('.*')}`).test(url)
}

/**
 * checks whether the provided URL matches the rule list (cond), following the exclusion rule priority
 * @param cond
 * @param url
 */
export function matches(cond: timer.limit.Item['cond'], url: string): boolean {
    let hit = false
    for (let i = cond.length - 1; i >= 0; i--) {
        const rule = cond[i]
        if (rule.startsWith(EXCLUDING_PREFIX)) {
            if (matchUrl(rule.slice(1), url)) return false
        } else {
            hit = hit || matchUrl(rule, url)
        }
    }
    return hit
}

/**
 * determines which normal rules in the given list (cond) match the provided URL, strictly adhering to exclusion rule priority
 * @param cond
 * @param url
 */
export function matchCond(cond: timer.limit.Item['cond'], url: string): string[] {
    const matchedNormalRules: string[] = []
    for (let i = cond.length - 1; i >= 0; i--) {
        const rule = cond[i]
        if (rule.startsWith(EXCLUDING_PREFIX)) {
            // Immediately return an empty array if an exclusion rule is hit
            if (matchUrl(rule.slice(1), url)) return []
        } else {
            if (matchUrl(rule, url)) matchedNormalRules.push(rule)
        }
    }
    return matchedNormalRules
}

export const meetLimit = (limit: number | undefined, value: number | undefined): boolean => {
    return !!limit && !!value && value > limit
}

type LimitInfo = { wasted: number, maxLimit: number | undefined }
type DelayInfo = { count: number, duration: number, allow: boolean }

export const meetTimeLimit = (limit: LimitInfo, delay: DelayInfo) => {
    const { wasted, maxLimit = 0 } = limit
    const { count, duration, allow } = delay
    const realLimit = allow ? maxLimit + duration * MILL_PER_MINUTE * (count ?? 0) : maxLimit
    return meetLimit(realLimit, wasted)
}

export function hasDailyLimited(item: timer.limit.Item, delayDuration: number): boolean {
    const { time, count, waste, visit, delayCount, allowDelay } = item
    const delay = { count: delayCount, duration: delayDuration, allow: !!allowDelay }
    const limit = { wasted: waste, maxLimit: (time ?? 0) * MILL_PER_SECOND }
    return meetTimeLimit(limit, delay) || meetLimit(count, visit)
}

export function hasWeeklyLimited(item: timer.limit.Item, delayDuration: number): boolean {
    const { weekly, weeklyCount, weeklyWaste, weeklyVisit, weeklyDelayCount, allowDelay } = item
    const delay = { count: weeklyDelayCount, duration: delayDuration, allow: !!allowDelay }
    const limit = { wasted: weeklyWaste, maxLimit: (weekly ?? 0) * MILL_PER_SECOND }
    return meetTimeLimit(limit, delay) || meetLimit(weeklyCount, weeklyVisit)
}

export function hasLimited(item: timer.limit.Item, delayDuration: number): boolean {
    return hasDailyLimited(item, delayDuration) || hasWeeklyLimited(item, delayDuration)
}

export function isEffective(weekdays: timer.limit.Rule['weekdays'], weekday?: number): boolean {
    const weekdayLen = weekdays?.length
    if (!weekdayLen || weekdayLen <= 0 || weekdayLen >= 7) return true
    return weekdays.includes(weekday ?? getWeekDay(new Date()))
}

const idx2Str = (time: number | undefined): string => {
    time = time ?? 0
    const hour = Math.floor(time / 60)
    const min = time - hour * 60
    const hourStr = (hour < 10 ? "0" : "") + hour
    const minStr = (min < 10 ? "0" : "") + min
    return `${hourStr}:${minStr}`
}

export const date2Idx = (date: Date): number => date.getHours() * 60 * 60 + date.getMinutes() * 60 + date.getSeconds()

export const dateMinute2Idx = (date: Date): number => {
    const hour = date.getHours()
    const min = date.getMinutes()
    return hour * 60 + min
}

export const period2Str = (p: timer.limit.Period | undefined): string => {
    const [start, end] = p ?? []
    return `${idx2Str(start)}-${idx2Str(end)}`
}
