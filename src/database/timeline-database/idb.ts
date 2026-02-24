import { BaseIDBStorage, iterateCursor, req2Promise, type Index, type Key, type Table } from '@db/common/indexed-storage'
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
            const exist = await req2Promise<timer.timeline.Tick[]>(index.getAll(hosts)) ?? []

            // Group exist records by host for O(N+M) instead of O(N*M)
            const existByHost = new Map<string, timer.timeline.Tick[]>()
            exist.forEach(item => {
                const list = existByHost.get(item.host) ?? []
                list.push(item)
                existByHost.set(item.host, list)
            })

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
                    let { start, duration, host } = tick
                    start = Math.min(mergeTarget.start, start)
                    duration = Math.max(mergeTarget.start + mergeTarget.duration, start + duration) - start
                    toSave.push({ host, start, duration })
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
            const { cursorReq, coverage } = this.judgeIndex(store, cond)
            const rows = await iterateCursor<timer.timeline.Tick>(cursorReq)
            const { start: cs, host: ch } = cond ?? {}
            return rows.filter(tick => {
                const { host, start } = tick
                if (cs && !coverage.start && start < cs) {
                    return false
                }
                if (ch && !coverage.host && host !== ch) {
                    return false
                }
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

    private judgeIndex(
        store: IDBObjectStore,
        cond?: TimelineCondition,
    ): { cursorReq: IDBRequest<IDBCursorWithValue | null>; coverage: IndexCoverage } {
        // debugger
        const { host, start } = cond ?? {}
        console.log(host, start)
        if (start) {
            return {
                cursorReq: this.assertIndex(store, 'start').openCursor(IDBKeyRange.lowerBound(start)), coverage: { start: true }
            }
        } else if (host) {
            return {
                cursorReq: this.assertIndex(store, 'host').openCursor(IDBKeyRange.only(host)), coverage: { host: true }
            }
        } else {
            return { cursorReq: store.openCursor(), coverage: {} }
        }
    }
}