import { judgeVirtualFast } from "@util/pattern"
import { formatTimeYMD } from "@util/time"
import { type StatCondition, type StatDatabase } from "."
import { GROUP_PREFIX } from "./constants"

type _StatCondition = StatCondition & {
    // Use exact date condition
    useExactDate?: boolean
    // date str
    exactDateStr?: string
    startDateStr?: string
    endDateStr?: string
    // time range
    timeStart?: number
    timeEnd?: number
    focusStart?: number
    focusEnd?: number
}

type _FilterResult = {
    host: string
    date: string
    value: timer.core.Result
}

function filterHost(host: string, condition: _StatCondition): boolean {
    const { keys, virtual } = condition
    const keyArr = typeof keys === 'string' ? [keys] : keys
    // 1. virtual
    if (!virtual && judgeVirtualFast(host)) return false
    // 2. host
    if (keyArr?.length && !keyArr.includes(host)) return false
    return true
}

function filterDate(
    date: string,
    { useExactDate, exactDateStr, startDateStr, endDateStr }: _StatCondition
): boolean {
    if (useExactDate) {
        if (exactDateStr !== date) return false
    } else {
        if (startDateStr && startDateStr > date) return false
        if (endDateStr && endDateStr < date) return false
    }
    return true
}

function filterNumberRange(val: number, [start, end]: [start?: number, end?: number]): boolean {
    if (start !== null && start !== undefined && start > val) return false
    if (end !== null && end !== undefined && end < val) return false
    return true
}

/**
 * Filter by query parameters
 *
 * @param date date of item
 * @param host  host of item
 * @param val  val of item
 * @param condition  query parameters
 * @return true if valid, or false
 */
function filterByCond(result: _FilterResult, condition: _StatCondition): boolean {
    const { host, date, value } = result
    const { focus, time } = value
    const { timeStart, timeEnd, focusStart, focusEnd } = condition

    return filterHost(host, condition)
        && filterDate(date, condition)
        && filterNumberRange(time, [timeStart, timeEnd])
        && filterNumberRange(focus, [focusStart, focusEnd])
}


function processDateCondition(cond: _StatCondition, paramDate?: Date | [Date, Date?]) {
    if (!paramDate) return

    if (paramDate instanceof Date) {
        cond.useExactDate = true
        cond.exactDateStr = formatTimeYMD(paramDate as Date)
    } else {
        let startDate: Date | undefined = undefined
        let endDate: Date | undefined = undefined
        const dateArr = paramDate as [Date, Date]
        dateArr && dateArr.length >= 2 && (endDate = dateArr[1])
        dateArr && dateArr.length >= 1 && (startDate = dateArr[0])
        cond.useExactDate = false
        startDate && (cond.startDateStr = formatTimeYMD(startDate))
        endDate && (cond.endDateStr = formatTimeYMD(endDate))
    }
}

function processParamTimeCondition(cond: _StatCondition, paramTime?: [number, number?]) {
    if (!paramTime) return
    paramTime.length >= 2 && (cond.timeEnd = paramTime[1])
    paramTime.length >= 1 && (cond.timeStart = paramTime[0])
}

function processParamFocusCondition(cond: _StatCondition, paramFocus?: Vector<2>) {
    if (!paramFocus) return
    paramFocus.length >= 2 && (cond.focusEnd = paramFocus[1])
    paramFocus.length >= 1 && (cond.focusStart = paramFocus[0])
}

function processCondition(condition: StatCondition): _StatCondition {
    const result: _StatCondition = { ...condition }
    processDateCondition(result, condition.date)
    processParamTimeCondition(result, condition.timeRange)
    processParamFocusCondition(result, condition.focusRange)
    return result
}

/**
 * Filter by query parameters
 */
export async function filter(this: StatDatabase, condition?: StatCondition, onlyGroup?: boolean): Promise<_FilterResult[]> {
    const cond = processCondition(condition ?? {})
    const items = await this.refresh()
    const result: _FilterResult[] = []
    Object.entries(items).forEach(([key, value]) => {
        const date = key.substring(0, 8)
        let host = key.substring(8)
        if (onlyGroup) {
            if (host.startsWith(GROUP_PREFIX)) {
                host = host.substring(GROUP_PREFIX.length)
                result.push({ date, host, value: value as timer.core.Result })
            }
        } else if (!host.startsWith(GROUP_PREFIX)) {
            result.push({ date, host, value: value as timer.core.Result })
        }
    })
    return result.filter(item => filterByCond(item, cond))
}
