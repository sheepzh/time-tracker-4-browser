import { addRunTime } from "@service/item-service"
import whitelistHolder from "@service/whitelist/holder"
import { formatTimeYMD, getStartOfDay, MILL_PER_DAY } from "@util/time"

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

export async function handleTrackRunTimeEvent(event: timer.core.Event, url: string | undefined): Promise<void> {
    const { start, end, host } = event ?? {}
    if (!host || !start || !end || !url) return
    if (whitelistHolder.contains(host, url)) return
    const byDate = splitRunTime(start, end)
    if (!Object.keys(byDate).length) return
    await addRunTime(host, byDate)
}