import { judgeVirtualFast } from "@util/pattern"
import { formatTimeYMD } from "@util/time"
import type { StatCondition } from './types'

export type ProcessedCondition = StatCondition & {
    useExactDate?: boolean
    exactDateStr?: string
    startDateStr?: string
    endDateStr?: string
    timeStart?: number
    timeEnd?: number
    focusStart?: number
    focusEnd?: number
}

export function filterHost(host: string, keys: ProcessedCondition['keys'], virtual?: boolean): boolean {
    if (!virtual && judgeVirtualFast(host)) return false
    if (keys === undefined) return true
    return typeof keys === 'string' ? host === keys : keys.includes(host)
}

export function filterDate(
    date: string,
    { useExactDate, exactDateStr, startDateStr, endDateStr }: ProcessedCondition
): boolean {
    if (useExactDate) {
        if (exactDateStr !== date) return false
    } else {
        if (startDateStr && startDateStr > date) return false
        if (endDateStr && endDateStr < date) return false
    }
    return true
}

export function filterNumberRange(val: number, [start, end]: [start?: number, end?: number]): boolean {
    if (start !== null && start !== undefined && start > val) return false
    if (end !== null && end !== undefined && end < val) return false
    return true
}

export function processCondition(condition?: StatCondition): ProcessedCondition {
    const result: ProcessedCondition = { ...condition }

    const paramDate = condition?.date
    if (paramDate) {
        if (paramDate instanceof Date) {
            result.useExactDate = true
            result.exactDateStr = formatTimeYMD(paramDate)
        } else {
            const [startDate, endDate] = paramDate
            result.useExactDate = false
            startDate && (result.startDateStr = formatTimeYMD(startDate))
            endDate && (result.endDateStr = formatTimeYMD(endDate))
        }
    }

    const paramTime = condition?.timeRange
    if (paramTime) {
        paramTime.length >= 2 && (result.timeEnd = paramTime[1])
        paramTime.length >= 1 && (result.timeStart = paramTime[0])
    }

    const paramFocus = condition?.focusRange
    if (paramFocus) {
        paramFocus.length >= 2 && (result.focusEnd = paramFocus[1])
        paramFocus.length >= 1 && (result.focusStart = paramFocus[0])
    }

    return result
}
