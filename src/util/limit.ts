import { EXCLUDING_PREFIX } from './constant/remain-host'
import { getWeekDay, MILL_PER_MINUTE, MILL_PER_SECOND } from "./time"

const GLOBSTAR_TOKEN = `__GLOBSTAR${Math.random().toString(36).slice(2, 6)}__`

export const matchUrl = (cond: string, url: string): boolean => {
    const normalizedCond = cond.length > 1 ? cond.replace(/\/$/, '') : cond
    const pattern = normalizedCond
        .replace(/\*\*/g, GLOBSTAR_TOKEN)
        .split('*')
        .join('.*')
        .replaceAll(GLOBSTAR_TOKEN, '.+')
    return new RegExp(`^.*//${pattern}`).test(url)
}

/**
 * checks whether the provided URL matches the rule list (cond), following the exclusion rule priority
 * @param cond
 * @param url
 */
export function matches(cond: string[], url: string): boolean {
    let hit = false
    for (let i = cond.length - 1; i >= 0; i--) {
        const rule = cond[i]
        if (rule === undefined) continue
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
export function matchCond(cond: string[], url: string): string[] {
    const matchedNormalRules: string[] = []
    for (let i = cond.length - 1; i >= 0; i--) {
        const rule = cond[i]
        if (rule === undefined) continue
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
    const { wasted, maxLimit } = limit
    if (!maxLimit) return false
    const { count, duration, allow } = delay
    const realLimit = allow ? maxLimit + duration * MILL_PER_MINUTE * (count ?? 0) : maxLimit
    return meetLimit(realLimit, wasted)
}

export function hasDailyLimited(item: tt4b.limit.Item, delayDuration: number): boolean {
    const { time, count, waste, visit, delayCount, allowDelay } = item
    const delay = { count: delayCount, duration: delayDuration, allow: allowDelay }
    const limit = { wasted: waste, maxLimit: (time ?? 0) * MILL_PER_SECOND }
    return meetTimeLimit(limit, delay) || meetLimit(count, visit)
}

export function hasWeeklyLimited(item: tt4b.limit.Item, delayDuration: number): boolean {
    const { weekly, weeklyCount, weeklyWaste, weeklyVisit, weeklyDelayCount, allowDelay } = item
    const delay = { count: weeklyDelayCount, duration: delayDuration, allow: allowDelay }
    const limit = { wasted: weeklyWaste, maxLimit: (weekly ?? 0) * MILL_PER_SECOND }
    return meetTimeLimit(limit, delay) || meetLimit(weeklyCount, weeklyVisit)
}

export function hasLimited(item: tt4b.limit.Item, delayDuration: number): boolean {
    return hasDailyLimited(item, delayDuration) || hasWeeklyLimited(item, delayDuration)
}

export function isEffective(weekdays: tt4b.limit.Rule['weekdays'], weekday?: number): boolean {
    const weekdayLen = weekdays?.length
    if (!weekdayLen || weekdayLen <= 0 || weekdayLen >= 7) return true
    return weekdays.includes(weekday ?? getWeekDay(new Date()))
}

export const dateMinute2Idx = (date: Date): number => {
    const hour = date.getHours()
    const min = date.getMinutes()
    return hour * 60 + min
}

export const isInPeriod = (point: number, [s, e]: tt4b.limit.Period): boolean => {
    if (s <= e) return point >= s && point <= e
    return point >= s || point <= e
}
