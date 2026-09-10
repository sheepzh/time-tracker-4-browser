import timelineDatabase from '@db/timeline-database'
import { extractHostname } from '@util/pattern'
import { getStartOfDay, MILL_PER_DAY } from '@util/time'
import { FirefoxThrottler } from './firefox-throttler'

class TimelineThrottler extends FirefoxThrottler<tt4b.timeline.Tick> {
    public saveEvent(ev: tt4b.timeline.Event) {
        const { start, end, url } = ev
        const { host } = extractHostname(url)
        if (!host) return

        const durations = split2Durations(start, end)
        const ticks: tt4b.timeline.Tick[] = durations.map(([start, duration]) => ({ start, duration, host }))
        this.save(ticks)
    }

    protected doStore(data: tt4b.timeline.Tick[]): void {
        timelineDatabase.batchSave(data)
    }
}

const split2Durations = (start: number, end: number): [start: number, duration: number][] => {
    const result: [start: number, duration: number][] = []
    let current = start
    while (current < end) {
        const nextDayStart = getStartOfDay(current) + MILL_PER_DAY
        const segmentEnd = Math.min(nextDayStart, end)
        result.push([current, segmentEnd - current])
        current = segmentEnd
    }
    return result
}

const timelineThrottler = new TimelineThrottler()

export default timelineThrottler