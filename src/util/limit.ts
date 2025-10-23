import { EXCLUDING_PREFIX } from './constant/remain-host'
import { getWeekDay, MILL_PER_MINUTE, MILL_PER_SECOND } from "./time"

export const cleanCond = (origin: string | undefined): string | undefined => {
    if (!origin) return undefined

    const startIdx = origin?.indexOf('//')
    const endIdx = origin?.indexOf('?')
    let res = origin.substring(startIdx === -1 ? 0 : startIdx + 2, endIdx === -1 ? undefined : endIdx)
    while (res.endsWith('/')) {
        res = res.substring(0, res.length - 1)
    }
    return res || undefined
}

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

export const meetTimeLimit = (
    delayMin: number,
    limitSec: number | undefined, wastedMill: number | undefined,
    allowDelay: boolean | undefined, delayCount: number | undefined
): boolean => {
    const delayMill = MILL_PER_MINUTE * delayMin
    let realLimit = (limitSec ?? 0) * MILL_PER_SECOND
    allowDelay && realLimit && (realLimit += delayMill * (delayCount ?? 0))
    return meetLimit(realLimit, wastedMill)
}

type TimeLimitState = 'NORMAL' | 'REMINDER' | 'LIMITED'

type LimitStateResult = {
    daily: TimeLimitState
    weekly: TimeLimitState
}

export function calcTimeState(delayMin: number, item: timer.limit.Item, reminderMills: number): LimitStateResult {
    let res: LimitStateResult = {
        daily: "NORMAL",
        weekly: "NORMAL",
    }
    const {
        time, waste, delayCount,
        weekly, weeklyWaste, weeklyDelayCount,
        allowDelay,
    } = item || {}
    // 1. daily states
    if (meetTimeLimit(delayMin, time, waste, allowDelay, delayCount)) {
        res.daily = 'LIMITED'
    } else if (reminderMills && meetTimeLimit(delayMin, time, waste + reminderMills, allowDelay, delayCount)) {
        res.daily = 'REMINDER'
    }

    // 2. weekly states
    if (meetTimeLimit(delayMin, weekly, weeklyWaste, allowDelay, weeklyDelayCount)) {
        res.weekly = 'LIMITED'
    } else if (reminderMills && meetTimeLimit(delayMin, weekly, weeklyWaste + reminderMills, allowDelay, weeklyDelayCount)) {
        res.weekly = 'REMINDER'
    }

    return res
}

export function hasLimited(item: timer.limit.Item, delayMin: number): boolean {
    return hasDailyLimited(item, delayMin) || hasWeeklyLimited(item, delayMin)
}

export function hasDailyLimited(item: timer.limit.Item, delayMin: number): boolean {
    const { time, count = 0, waste = 0, visit = 0, delayCount = 0, allowDelay = false } = item || {}
    const timeMeet = meetTimeLimit(delayMin, time, waste, allowDelay, delayCount)
    const countMeet = meetLimit(count, visit)
    return timeMeet || countMeet
}

export function hasWeeklyLimited(item: timer.limit.Item, delayMin: number): boolean {
    const { weekly = 0, weeklyCount = 0, weeklyWaste = 0, weeklyVisit = 0, weeklyDelayCount = 0, allowDelay = false } = item || {}
    const timeMeet = meetTimeLimit(delayMin, weekly, weeklyWaste, allowDelay, weeklyDelayCount)
    const countMeet = meetLimit(weeklyCount, weeklyVisit)
    return timeMeet || countMeet
}

export function isEnabledAndEffective(rule: timer.limit.Rule): boolean {
    return !!rule?.enabled && isEffective(rule.weekdays)
}

export function isEffective(weekdays: timer.limit.Rule['weekdays']): boolean {
    const weekdayLen = weekdays?.length
    if (!weekdayLen || weekdayLen <= 0 || weekdayLen >= 7) {
        return true
    }
    const weekday = getWeekDay(new Date())
    return weekdays.includes(weekday)
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
    const [start, end] = p || []
    return `${idx2Str(start)}-${idx2Str(end)}`
}
