import itemService from "@service/item-service"
import whitelistHolder from "@service/whitelist/holder"
import { formatTimeYMD, getStartOfDay, MILL_PER_DAY } from "@util/time"

function splitRunTime(start: number, end: number): Record<string, number> {
    const res: Record<string, number> = {}
    while (start < end) {
        const startOfNextDay = getStartOfDay(start).getTime() + MILL_PER_DAY
        const newStart = Math.min(end, startOfNextDay)
        const runTime = newStart - start
        runTime && (res[formatTimeYMD(start)] = runTime)
        start = newStart
    }
    return res
}

const RUN_TIME_END_CACHE: { [host: string]: number } = {}

export async function handleTrackRunTimeEvent(event: timer.core.Event): Promise<void> {
    const { start, end, url, host } = event || {}
    if (!host || !start || !end) return
    if (whitelistHolder.contains(host, url)) return
    const realStart = Math.max(RUN_TIME_END_CACHE[host] ?? 0, start)
    const byDate = splitRunTime(realStart, end)
    if (!Object.keys(byDate).length) return
    await itemService.addRunTime(host, byDate)
    RUN_TIME_END_CACHE[host] = Math.max(end, realStart)
}