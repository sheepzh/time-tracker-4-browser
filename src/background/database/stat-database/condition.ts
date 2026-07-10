import { judgeVirtualFast } from "@util/pattern"
import type { StatCondition } from './types'

export type ProcessedCondition = StatCondition & {
    useExactDate?: boolean
    exactDateStr?: string
    startDateStr?: string
    endDateStr?: string
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

export function processCondition(condition?: StatCondition): ProcessedCondition {
    const result: ProcessedCondition = { ...condition }

    const paramDate = condition?.date

    if (typeof paramDate === 'string') {
        result.useExactDate = true
        result.exactDateStr = paramDate
    } else if (paramDate) {
        result.startDateStr = paramDate[0]
        result.endDateStr = paramDate[1]
    }

    return result
}
