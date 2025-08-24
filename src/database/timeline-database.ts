import { formatTimeYMD, MILL_PER_DAY } from '@util/time'
import BaseDatabase from './common/base-database'
import { REMAIN_WORD_PREFIX } from './common/constant'

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

// If two tick with the same host is near 1 sec, then merge them to one
const MERGE_THRESHOLD = 1000

const canMerge = (item: Item, tick: timer.timeline.Tick) => {
    const { s: is, d: id } = item
    const { start } = tick
    return start >= is + id
        && start <= id + MERGE_THRESHOLD
}

const isConflict = (item: Item, tick: timer.timeline.Tick) => {
    const { s: is, d: id } = item
    const { start } = tick
    return is <= start && start < is + id
}

const merge = (data: TimelineData, tick: timer.timeline.Tick) => {
    const { start, duration, host } = tick
    const date = formatTimeYMD(start)
    const hostData = data[date] ?? {}
    const items = hostData[host] ?? []
    items.sort((a, b) => (a?.s ?? 0) - (b?.s ?? 0))
    for (const item of items) {
        if (isConflict(item, tick)) {
            return
        }
        if (canMerge(item, tick)) {
            item.d = start + duration - item.s
            return
        }
    }
    // normal tick
    items.push({ s: start, d: duration })
    hostData[host] = items
    data[date] = hostData
}

export const TIMELINE_LIFE_CYCLE = 3

const removeOutdated = (data: TimelineData, currTime: number) => {
    const minDate = formatTimeYMD(currTime - MILL_PER_DAY * (TIMELINE_LIFE_CYCLE - 1))
    const keys = Object.keys(data).filter(k => k < minDate)
    keys.forEach(key => delete data[key])
}

class TimelineDatabase extends BaseDatabase {
    private async getData(): Promise<TimelineData> {
        const data = await this.storage.getOne<TimelineData>(DB_KEY)
        return data ?? {}
    }

    private setData(data: TimelineData): Promise<void> {
        return this.setByKey(DB_KEY, data)
    }

    async batchSave(ticks: timer.timeline.Tick[]) {
        const data = await this.getData()
        ticks.forEach(tick => {
            merge(data, tick)
            removeOutdated(data, tick.start)
        })
        await this.setData(data)
    }

    async getAll(): Promise<timer.timeline.Tick[]> {
        const data = await this.getData()
        const result: timer.timeline.Tick[] = []
        Object.values(data).forEach(hostData => {
            Object.entries(hostData).forEach(([host, items]) => {
                items.forEach(({ s: start, d: duration }) => result.push({ host, start, duration }))
            })
        })
        return result
    }

    async importData(_: any): Promise<void> {
        // do nothing
    }
}
const timelineDatabase = new TimelineDatabase()

export default timelineDatabase