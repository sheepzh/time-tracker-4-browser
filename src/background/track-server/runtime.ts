import whitelistHolder from "@service/whitelist/holder"
import FIFOCache from '@util/fifo-cache'
import { formatTimeYMD, getStartOfDay, MILL_PER_DAY } from "@util/time"
import { addRunTime } from '../service/item-service'

function splitRunTime(start: number, end: number): Record<string, number> {
    const res: Record<string, number> = {}
    while (start < end) {
        const startOfNextDay = getStartOfDay(start) + MILL_PER_DAY
        const newStart = Math.min(end, startOfNextDay)
        const runTime = newStart - start
        runTime && (res[formatTimeYMD(start)] = runTime)
        start = newStart
    }
    return res
}

const RUN_TIME_END_CACHE = new FIFOCache<number>(500)

export async function handleTrackRunTimeEvent(event: timer.core.Event, url: string | undefined): Promise<void> {
    const { start, end, host } = event
    if (!host || !start || !end || !url) return
    if (whitelistHolder.contains(host, url)) return
    const realStart = Math.max(RUN_TIME_END_CACHE.get(host) ?? 0, start)
    const byDate = splitRunTime(realStart, end)
    if (!Object.keys(byDate).length) return
    await addRunTime(host, byDate)
    RUN_TIME_END_CACHE.set(host, Math.max(end, realStart))
}