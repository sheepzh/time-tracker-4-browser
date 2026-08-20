import FIFOCache from '@util/fifo-cache'
import { formatTimeYMD, getStartOfDay, MILL_PER_DAY } from "@util/time"
import { addMediaTime, addRunTime } from '../service/item-service'

function splitTime2Dates(start: number, end: number): Record<string, number> {
    const res: Record<string, number> = {}
    while (start < end) {
        const startOfNextDay = getStartOfDay(start) + MILL_PER_DAY
        const newStart = Math.min(end, startOfNextDay)
        const time = newStart - start
        time && (res[formatTimeYMD(start)] = time)
        start = newStart
    }
    return res
}

const RUN_TIME_END_CACHE = new FIFOCache<number>(100)

export async function handleRunTime(event: tt4b.core.Event): Promise<void> {
    const { start, end, host } = event
    if (!host || !start || !end) return
    const realStart = Math.max(RUN_TIME_END_CACHE.get(host) ?? 0, start)
    const byDate = splitTime2Dates(realStart, end)
    if (!Object.keys(byDate).length) return
    await addRunTime(host, byDate)
    RUN_TIME_END_CACHE.set(host, Math.max(end, realStart))
}

const MEDIA_TIME_END_CACHE = new FIFOCache<number>(100)

export async function handleMediaTime(event: tt4b.core.Event): Promise<void> {
    const { start, end, host } = event
    if (!host || !start || !end) return
    const realStart = Math.max(MEDIA_TIME_END_CACHE.get(host) ?? 0, start)
    const byDate = splitTime2Dates(realStart, end)
    if (!Object.keys(byDate).length) return
    await addMediaTime(host, byDate)
    MEDIA_TIME_END_CACHE.set(host, Math.max(end, realStart))
}