import timelineDatabase from '@db/timeline-database'
import { extractHostname } from '@util/pattern'

const split2Durations = (start: number, end: number): [start: number, duration: number][] => {
    const result: [start: number, duration: number][] = []

    if (start >= end) {
        return result
    }

    let currentStart = start

    while (currentStart < end) {
        const currentDate = new Date(currentStart)
        const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime()
        const nextDayStart = dayStart + 24 * 60 * 60 * 1000
        const segmentEnd = Math.min(nextDayStart, end)

        const duration = segmentEnd - currentStart
        result.push([currentStart, duration])

        currentStart = segmentEnd
    }

    return result
}

export async function saveTimelineEvent(ev: timer.timeline.Event): Promise<void> {
    const { start, end, url } = ev
    const { host } = extractHostname(url)
    if (!host) return

    const durations = split2Durations(start, end)
    const ticks: timer.timeline.Tick[] = durations.map(([start, duration]) => ({ start, duration, host }))
    await timelineDatabase.batchSave(ticks)
}
