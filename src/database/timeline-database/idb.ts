import {
    BaseIDBStorage, iterateCursor, req2Promise,
    type Index, type IndexResult, type Key, type Table,
} from '@db/common/indexed-storage'
import { MILL_PER_DAY, MILL_PER_SECOND } from '@util/time'
import type { TimelineCondition, TimelineDatabase } from './types'

const TIME_LIFE_CYCLE = MILL_PER_DAY * 366

// If two tick with the same host is near 1 sec, then merge them to one
const MERGE_THRESHOLD = MILL_PER_SECOND

const canMerge = (exist: timer.timeline.Tick, tick: timer.timeline.Tick) => {
    const { start: existStart, host: existHost } = exist
    const { start, host } = tick
    return existHost === host && start >= existStart && start <= existStart + MERGE_THRESHOLD
}

const isConflict = (item: timer.timeline.Tick, tick: timer.timeline.Tick) => {
    const { start: itemStart, duration: itemDuration } = item
    const { start } = tick
    return itemStart <= start && start < itemStart + itemDuration
}

type IndexCoverage = {
    host?: boolean
    start?: boolean
}

class CleanThrottle {
    private lastTime = 0
    private readonly interval: number = MILL_PER_DAY

    tryClean(doClean: () => void): void {
        const now = Date.now()
        if (now - this.lastTime >= this.interval) {
            this.lastTime = now
            doClean()
        }
    }
}

export default class IDBTimelineDatabase extends BaseIDBStorage<timer.timeline.Tick> implements TimelineDatabase {
    indexes: Index<timer.timeline.Tick>[] = [
        'host', 'start',
    ]
    key: Key<timer.timeline.Tick> | Key<timer.timeline.Tick>[] = ['host', 'start']
    table: Table = 'timeline'
    private cleanThrottle = new CleanThrottle()

    batchSave(ticks: timer.timeline.Tick[]): Promise<void> {
        return this.withStore(async store => {
            const index = this.assertIndex(store, 'host')
            const hosts = Array.from(new Set(ticks.map(tick => tick.host)))

            // Fetch existing records for all hosts
            const existByHost = new Map<string, timer.timeline.Tick[]>()
            await Promise.all(hosts.map(async host => {
                const req = index.getAll(IDBKeyRange.only(host))
                const exist = await req2Promise<timer.timeline.Tick[]>(req)
                exist && existByHost.set(host, exist)
            }))

            const toSave: timer.timeline.Tick[] = []
            const toDelete: timer.timeline.Tick[] = []
            ticks.forEach(tick => {
                const existForHost = existByHost.get(tick.host) ?? []

                // Check if there's any conflict
                const anyConflict = existForHost.some(exist => isConflict(exist, tick))
                if (anyConflict) return

                // Find a record that can be merged
                const mergeTarget = existForHost.find(exist => canMerge(exist, tick))
                if (mergeTarget) {
                    toDelete.push(mergeTarget)
                    const { host, start, duration } = tick
                    const newStart = Math.min(mergeTarget.start, start)
                    const newEnd = Math.max(mergeTarget.start + mergeTarget.duration, start + duration)
                    const newDuration = newEnd - newStart
                    toSave.push({ host, start: newStart, duration: newDuration })
                } else {
                    // No conflict and no merge, save the new tick
                    toSave.push(tick)
                }
            })
            toDelete.forEach(tick => store.delete([tick.host, tick.start]))
            toSave.forEach(tick => store.put(tick))
        }, 'readwrite')
    }

    async select(cond?: TimelineCondition): Promise<timer.timeline.Tick[]> {
        const rows = await this.withStore(async store => {
            const { cursorReq, coverage = {} } = this.judgeIndex(store, cond)
            const rows = await iterateCursor<timer.timeline.Tick>(cursorReq)
            const { start: cs, host: ch } = cond ?? {}
            return rows.filter(tick => {
                const { host, start } = tick
                if (cs && !coverage.start && start < cs) return false
                if (ch && !coverage.host && host !== ch) return false
                return true
            })
        }, 'readonly')

        // Cleanup outdated ticks periodically
        this.cleanThrottle.tryClean(() => this.withStore(store => {
            const index = this.assertIndex(store, 'start')
            const req = index.openCursor(IDBKeyRange.upperBound(Date.now() - TIME_LIFE_CYCLE, true))
            iterateCursor(req, cursor => { cursor.delete() })
        }, 'readwrite').catch(e => console.error('Failed to cleanup outdated ticks', e)))
        return rows
    }

    private judgeIndex(store: IDBObjectStore, cond?: TimelineCondition): IndexResult<IndexCoverage> {
        const { host, start } = cond ?? {}
        if (host) {
            return {
                cursorReq: this.assertIndexCursor(store, 'host', IDBKeyRange.only(host)),
                coverage: { host: true },
            }
        } else if (start !== undefined && start > 0) {
            return {
                cursorReq: this.assertIndexCursor(store, 'start', IDBKeyRange.lowerBound(start, false)),
                coverage: { start: true },
            }
        } else {
            return { cursorReq: store.openCursor() }
        }
    }
}