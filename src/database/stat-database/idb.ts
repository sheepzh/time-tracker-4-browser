import { BaseIDBStorage, iterateCursor, type Key, req2Promise, type Table } from '@db/common/indexed-storage'
import { cvtGroupId2Host, formatDateStr, increase, zeroResult } from './common'
import { filterDate, filterHost, filterNumberRange, processCondition, type ProcessedCondition } from './condition'
import type { StatCondition, StatDatabase } from './types'

type StoredRow = timer.core.Row & {
    // If present, this is a group row
    groupId?: number
}

function fromStoredRow(stored: StoredRow): timer.core.Row {
    if (stored.groupId !== undefined) {
        const { groupId, ...row } = stored
        return { ...row, host: cvtGroupId2Host(groupId) }
    }
    return stored
}

const GROUP_HOST_PATTERN = /^_g_(\d+)$/

const INDEXES: (Key<StoredRow> | Key<StoredRow>[])[] = [
    'date', 'host', 'groupId',
    'focus', 'time',
    ['date', 'host'],
] as const

const isGroup = (row: StoredRow): boolean => row.groupId !== undefined

type IndexCoverage = {
    date?: boolean
    host?: boolean
    time?: boolean
    focus?: boolean
}

function buildFilter(cond: ProcessedCondition, coverage: IndexCoverage): (row: StoredRow) => boolean {
    return (row: StoredRow) => {
        if (!coverage.time && !filterNumberRange(row.time, [cond.timeStart, cond.timeEnd])) {
            return false
        }

        if (!coverage.focus && !filterNumberRange(row.focus, [cond.focusStart, cond.focusEnd])) {
            return false
        }

        if (!coverage.date && !filterDate(row.date, cond)) {
            return false
        }

        if (!coverage.host && !filterHost(row.host, cond)) {
            return false
        }

        return true
    }
}

type StatIndex = typeof INDEXES[number]

export class IDBStatDatabase extends BaseIDBStorage<StoredRow> implements StatDatabase {
    table: Table = 'stat'
    key: StatIndex = ['date', 'host']
    indexes: StatIndex[] = INDEXES

    get(host: string, date: Date | string): Promise<timer.core.Result> {
        return this.withStore(async store => {
            const index = super.assertIndex(store, ['date', 'host'])
            const dateStr = formatDateStr(date)
            const req = index.get([dateStr, host])
            return await req2Promise<StoredRow>(req) ?? zeroResult()
        }, 'readonly')
    }

    private judgeIndex(
        store: IDBObjectStore,
        cond: ProcessedCondition,
        expectGroup: boolean
    ): { cursorReq: IDBRequest<IDBCursorWithValue | null>; coverage: IndexCoverage } {
        if (expectGroup) {
            const keys = typeof cond.keys === 'string' ? [cond.keys] : cond.keys
            const index = super.assertIndex(store, 'groupId')

            if (keys?.length === 1) {
                const groupId = parseInt(keys[0])
                if (!isNaN(groupId)) {
                    return {
                        cursorReq: index.openCursor(IDBKeyRange.only(groupId)),
                        coverage: { host: true }
                    }
                }
            }

            return {
                cursorReq: index.openCursor(IDBKeyRange.lowerBound(0)),
                coverage: {}
            }
        }

        const keys = typeof cond.keys === 'string' ? [cond.keys] : cond.keys

        if (cond.useExactDate && cond.exactDateStr && keys?.length === 1) {
            const index = super.assertIndex(store, ['date', 'host'])
            return {
                cursorReq: index.openCursor(IDBKeyRange.only([cond.exactDateStr, keys[0]])),
                coverage: { date: true, host: true }
            }
        }

        if (cond.useExactDate && cond.exactDateStr) {
            const index = super.assertIndex(store, 'date')
            return {
                cursorReq: index.openCursor(IDBKeyRange.only(cond.exactDateStr)),
                coverage: { date: true }
            }
        }

        if (cond.startDateStr || cond.endDateStr) {
            const index = super.assertIndex(store, 'date')
            const range = IDBKeyRange.bound(
                cond.startDateStr ?? '',
                cond.endDateStr ?? '\uffff',
                false, false,
            )
            return {
                cursorReq: index.openCursor(range),
                coverage: { date: true }
            }
        }

        if (cond.timeStart !== undefined || cond.timeEnd !== undefined) {
            const index = super.assertIndex(store, 'time')
            const range = IDBKeyRange.bound(
                cond.timeStart ?? 0,
                cond.timeEnd ?? Number.MAX_SAFE_INTEGER,
                false, false,
            )
            return {
                cursorReq: index.openCursor(range),
                coverage: { time: true }
            }
        }

        if (cond.focusStart !== undefined || cond.focusEnd !== undefined) {
            const index = super.assertIndex(store, 'focus')
            const range = IDBKeyRange.bound(
                cond.focusStart ?? 0,
                cond.focusEnd ?? Number.MAX_SAFE_INTEGER,
                false, false,
            )
            return {
                cursorReq: index.openCursor(range),
                coverage: { focus: true }
            }
        }

        return {
            cursorReq: store.openCursor(),
            coverage: {}
        }
    }

    private async selectInternal(store: IDBObjectStore, cond: ProcessedCondition, expectGroup: boolean): Promise<timer.core.Row[]> {
        const allRows: timer.core.Row[] = []
        const { cursorReq, coverage } = this.judgeIndex(store, cond, expectGroup)
        const filter = buildFilter(cond, coverage)

        const rows = await iterateCursor<StoredRow>(cursorReq)
        for (const row of rows) {
            if (expectGroup) {
                if (!isGroup(row)) continue
            } else {
                if (isGroup(row)) continue
            }

            if (!filter(row)) continue

            if (expectGroup) {
                allRows.push({
                    host: row.groupId!.toString(),
                    date: row.date,
                    time: row.time,
                    focus: row.focus,
                    run: row.run,
                })
            } else {
                allRows.push(row)
            }
        }

        return allRows
    }

    select(condition?: StatCondition): Promise<timer.core.Row[]> {
        return this.withStore(async store => {
            const cond = processCondition(condition)
            return this.selectInternal(store, cond, false)
        }, 'readonly')
    }

    accumulate(host: string, date: Date | string, item: timer.core.Result): Promise<timer.core.Result> {
        return this.withStore(async store => {
            const index = super.assertIndex(store, ['date', 'host'])
            const dateStr = formatDateStr(date)
            const req = index.get([dateStr, host])
            const existing = await req2Promise<StoredRow>(req)
            const newVal = increase(item, existing)
            const newData: StoredRow = { host, date: dateStr, ...newVal }
            await req2Promise(store.put(newData))
            return newData
        }, 'readwrite')
    }

    batchAccumulate(data: Record<string, timer.core.Result>, date: Date | string): Promise<Record<string, timer.core.Row>> {
        return this.withStore(async store => {
            const index = super.assertIndex(store, 'date')
            const dateStr = formatDateStr(date)
            const cursorReq = index.openCursor(IDBKeyRange.only(dateStr))
            const toUpdate: Record<string, timer.core.Row> = {}

            await iterateCursor(cursorReq, cursor => {
                const stored = cursor.value as StoredRow | undefined
                if (stored && !isGroup(stored)) {
                    toUpdate[stored.host] = fromStoredRow(stored)
                }
            })

            for (const [host, result] of Object.entries(data)) {
                const existing = toUpdate[host]
                const newValue: timer.core.Row = { host, date: dateStr, ...increase(result, existing) }
                toUpdate[host] = newValue
                store.put(newValue)
            }
            return toUpdate
        }, 'readwrite')
    }

    delete(...rows: timer.core.RowKey[]): Promise<void> {
        return this.withStore(async store => {
            const index = super.assertIndex(store, ['date', 'host'])
            for (const { host, date } of rows) {
                const dateStr = formatDateStr(date)
                const req = index.getKey([dateStr, host])
                const key = await req2Promise(req)
                if (key) {
                    await req2Promise(store.delete(key))
                }
            }
        }, 'readwrite')
    }

    deleteByHost(host: string, range?: [start?: Date | string, end?: Date | string]): Promise<string[]> {
        return this.withStore(async store => {
            const [start, end] = range ?? []
            const startStr = start ? formatDateStr(start) : undefined
            const endStr = end ? formatDateStr(end) : undefined

            if (startStr && startStr === endStr) {
                // Delete one day
                const index = super.assertIndex(store, ['date', 'host'])
                const req = index.getKey([startStr, host])
                const key = await req2Promise(req)
                if (key) {
                    await req2Promise(store.delete(key))
                }
                return [startStr]
            }

            // Delete by range
            const index = super.assertIndex(store, 'host')
            const cursorReq = index.openCursor(IDBKeyRange.only(host))
            const deletedDates = new Set<string>()

            await iterateCursor(cursorReq, cursor => {
                const r = cursor.value as StoredRow | undefined
                if (!r || isGroup(r)) return

                const dateStr = r.date
                const inRange = (!startStr || startStr <= dateStr) && (!endStr || dateStr <= endStr)
                if (inRange) {
                    cursor.delete()
                    deletedDates.add(dateStr)
                }
            })

            return Array.from(deletedDates)
        }, 'readwrite')
    }

    accumulateGroup(groupId: number, date: Date | string, item: timer.core.Result): Promise<timer.core.Result> {
        return this.withStore(async store => {
            const index = super.assertIndex(store, ['date', 'host'])
            const dateStr = formatDateStr(date)
            const host = cvtGroupId2Host(groupId)
            const req = index.get([dateStr, host])
            const existing = await req2Promise<StoredRow>(req)
            const newVal = increase(item, existing)
            const newData: StoredRow = { host, date: dateStr, groupId, ...newVal }
            await req2Promise(store.put(newData))
            return newData
        }, 'readwrite')
    }

    selectGroup(condition?: StatCondition): Promise<timer.core.Row[]> {
        return this.withStore(async store => {
            const cond = processCondition(condition)
            return this.selectInternal(store, cond, true)
        }, 'readonly')
    }

    deleteGroup(...rows: [groupId: number, date: string][]): Promise<void> {
        return this.withStore(async store => {
            const index = super.assertIndex(store, ['date', 'host'])
            for (const [groupId, date] of rows) {
                const host = cvtGroupId2Host(groupId)
                const dateStr = formatDateStr(date)
                const req = index.getKey([dateStr, host])
                const key = await req2Promise(req)
                if (key) {
                    await req2Promise(store.delete(key))
                }
            }
        }, 'readwrite')
    }

    deleteByGroup(groupId: number, range?: [start?: Date | string, end?: Date | string]): Promise<void> {
        return this.withStore(async store => {
            const [start, end] = range ?? []
            const startStr = start ? formatDateStr(start) : undefined
            const endStr = end ? formatDateStr(end) : undefined
            const host = cvtGroupId2Host(groupId)

            if (startStr && startStr === endStr) {
                // Delete one day
                const index = super.assertIndex(store, ['date', 'host'])
                const req = index.getKey([startStr, host])
                const key = await req2Promise(req)
                if (key) {
                    await req2Promise(store.delete(key))
                }
                return
            }

            // Delete by range
            const index = super.assertIndex(store, 'host')
            const cursorReq = index.openCursor(IDBKeyRange.only(host))

            await iterateCursor(cursorReq, cursor => {
                const r = cursor.value as StoredRow | undefined
                if (!r) return
                const dateStr = r.date
                const inRange = (!startStr || startStr <= dateStr) && (!endStr || dateStr <= endStr)
                inRange && cursor.delete()
            })
        }, 'readwrite')
    }

    forceUpdate(...rows: timer.core.Row[]): Promise<void> {
        return this.withStore(store => {
            for (const row of rows) {
                const { host, date, time, focus, run } = row
                const groupMatch = host.match(GROUP_HOST_PATTERN)
                const newData: StoredRow = { host, date, time, focus, run }
                groupMatch && (newData.groupId = parseInt(groupMatch[1]))
                store.put(newData)
            }
        }, 'readwrite')
    }

    forceUpdateGroup(...rows: timer.core.Row[]): Promise<void> {
        return this.withStore(store => {
            for (const row of rows) {
                const { host, date, time, focus, run } = row
                const groupId = parseInt(host)
                if (isNaN(groupId)) {
                    throw new Error(`Invalid group host: ${host}`)
                }
                const newData: StoredRow = { host, date, time, focus, run, groupId }
                store.put(newData)
            }
        }, 'readwrite')
    }
}