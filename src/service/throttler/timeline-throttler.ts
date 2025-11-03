import timelineDatabase from '@db/timeline-database'
import { extractHostname } from '@util/pattern'
import { FirefoxThrottler } from './firefox-throttler'

class TimelineThrottler extends FirefoxThrottler<timer.timeline.Tick> {
    public saveEvent(ev: timer.timeline.Event) {
        const { start, end, url } = ev
        const { host } = extractHostname(url)
        if (!host) return

        const durations = split2Durations(start, end)
        const ticks: timer.timeline.Tick[] = durations.map(([start, duration]) => ({ start, duration, host }))
        this.save(ticks)
    }

    protected doStore(data: timer.timeline.Tick[]): void {
        timelineDatabase.batchSave(data)
    }
}

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

const timelineThrottler = new TimelineThrottler()

export default timelineThrottler