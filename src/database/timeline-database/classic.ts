import BaseDatabase from '../common/base-database'
import { REMAIN_WORD_PREFIX } from '../common/constant'
import type { TimelineCondition, TimelineDatabase } from './types'

const DB_KEY = REMAIN_WORD_PREFIX + 'TL'

type Item = {
    // start
    s: number
    // duration
    d: number
}

type TimelineData = {
    [date: string]: {
        [host: string]: Item[]
    }
}

function filter(ticks: timer.timeline.Tick[], cond?: TimelineCondition): timer.timeline.Tick[] {
    if (!cond) {
        return ticks
    }
    const { start, host } = cond

    return ticks.filter(tick => {
        if (start && tick.start < start) {
            return false
        }
        if (host && tick.host !== host) {
            return false
        }
        return true
    })
}

/**
 * @deprecated Use IDBTimelineDatabase instead, this is for old version data migration
 */
export default class ClassicTimelineDatabase extends BaseDatabase implements TimelineDatabase {

    private async getData(): Promise<TimelineData> {
        const data = await this.storage.getOne<TimelineData>(DB_KEY)
        return data ?? {}
    }

    async batchSave(_ticks: timer.timeline.Tick[]): Promise<void> {
        console.warn("ClassicTimelineDatabase is deprecated, data will not be saved to it. This invoking is not expected")
        return
    }

    async select(cond?: TimelineCondition): Promise<timer.timeline.Tick[]> {
        const data = await this.getData()
        const ticks: timer.timeline.Tick[] = []
        Object.values(data).forEach(hostData => {
            Object.entries(hostData).forEach(([host, items]) => {
                items.forEach(({ s: start, d: duration }) => ticks.push({ host, start, duration }))
            })
        })
        return filter(ticks, cond)
    }

    async clear(): Promise<void> {
        await this.storage.remove(DB_KEY)
    }
}
