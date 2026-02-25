import BaseDatabase from '@db/common/base-database'
import { REMAIN_WORD_PREFIX } from '@db/common/constant'
import { log } from '@src/common/logger'
import { isOptionalInt } from '@util/guard'
import { escapeRegExp } from '@util/pattern'
import { isNotZeroResult } from '@util/stat'
import { createObjectGuard } from 'typescript-guard'
import { cvtGroupId2Host, formatDateStr, GROUP_PREFIX, increase, zeroResult } from './common'
import { filterDate, filterHost, filterNumberRange, processCondition, type ProcessedCondition } from './condition'
import type { StatCondition, StatDatabase } from './types'

/**
 * Generate the key in local storage by host and date
 *
 * @param host host
 * @param date date
 */
const generateKey = (host: string, date: Date | string) => formatDateStr(date) + host
const generateHostReg = (host: string): RegExp => RegExp(`^\\d{8}${escapeRegExp(host)}$`)

const generateGroupKey = (groupId: number, date: Date | string) => formatDateStr(date) + cvtGroupId2Host(groupId)
const generateGroupReg = (groupId: number): RegExp => RegExp(`^\\d{8}${escapeRegExp(cvtGroupId2Host(groupId))}$`)

const isPartialResult = createObjectGuard<Partial<timer.core.Result>>({
    focus: isOptionalInt,
    time: isOptionalInt,
    run: isOptionalInt,
})

function filterRow(row: timer.core.Row, condition: ProcessedCondition): boolean {
    const { host, date, focus, time } = row
    const { timeStart, timeEnd, focusStart, focusEnd, keys, virtual } = condition

    return filterHost(host, keys, virtual)
        && filterDate(date, condition)
        && filterNumberRange(time, [timeStart, timeEnd])
        && filterNumberRange(focus, [focusStart, focusEnd])
}

/**
 * Default implementation by `chrome.storage.local`
 */
export class ClassicStatDatabase extends BaseDatabase implements StatDatabase {

    async refresh(): Promise<{ [key: string]: unknown }> {
        const result = await this.storage.get()
        const items: Record<string, timer.core.Result> = {}
        Object.entries(result)
            .filter(([key]) => !key.startsWith(REMAIN_WORD_PREFIX))
            .forEach(([key, value]) => items[key] = value)
        return items
    }

    /**
     * @param host host
     * @since 0.1.3
     */
    accumulate(host: string, date: Date | string, item: timer.core.Result): Promise<timer.core.Result> {
        const key = generateKey(host, date)
        return this.accumulateInner(key, item)
    }

    /**
     * @param host host
     * @since 0.1.3
     */
    accumulateGroup(groupId: number, date: Date | string, item: timer.core.Result): Promise<timer.core.Result> {
        const key = generateGroupKey(groupId, date)
        return this.accumulateInner(key, item)
    }

    private async accumulateInner(key: string, item: timer.core.Result): Promise<timer.core.Result> {
        const exist = await this.storage.getOne<timer.core.Result>(key)
        const value = increase(item, exist)
        await this.setByKey(key, value)
        return value
    }

    /**
     * Batch accumulate
     *
     * @param data data: {host=>waste_per_day}
     * @param date date
     * @since 0.1.8
     */
    async batchAccumulate(data: Record<string, timer.core.Result>, date: Date | string): Promise<Record<string, timer.core.Result>> {
        const hosts = Object.keys(data)
        if (!hosts.length) return {}
        const dateStr = formatDateStr(date)
        const keys: { [host: string]: string } = {}
        hosts.forEach(host => keys[host] = generateKey(host, dateStr))

        const items = await this.storage.get(Object.values(keys))

        const toUpdate: Record<string, timer.core.Result> = {}
        const afterUpdated: Record<string, timer.core.Result> = {}
        Object.entries(keys).forEach(([host, key]) => {
            const item = data[host]
            const exist: timer.core.Result = increase(item, items[key] as timer.core.Result)
            toUpdate[key] = afterUpdated[host] = exist
        })
        await this.storage.set(toUpdate)
        return afterUpdated
    }

    /**
     * Filter by query parameters
     */
    private async filter(condition?: StatCondition, onlyGroup?: boolean): Promise<timer.core.Row[]> {
        const cond = processCondition(condition ?? {})
        const items = await this.refresh()
        const result: timer.core.Row[] = []
        Object.entries(items).forEach(([key, value]) => {
            const date = key.substring(0, 8)
            let host = key.substring(8)
            if (onlyGroup) {
                if (host.startsWith(GROUP_PREFIX)) {
                    host = host.substring(GROUP_PREFIX.length)
                } else {
                    return
                }
            } else if (host.startsWith(GROUP_PREFIX)) {
                return
            }
            const { focus, time, run } = value as timer.core.Result
            const row: timer.core.Row = { host, date, focus, time }
            run !== undefined && (row.run = run)
            filterRow(row, cond) && result.push(row)
        })
        return result
    }

    /**
     * Select
     *
     * @param condition     condition
     */
    async select(condition?: StatCondition): Promise<timer.core.Row[]> {
        log("select:{condition}", condition)
        return this.filter(condition)
    }

    async selectGroup(condition?: StatCondition): Promise<timer.core.Row[]> {
        return this.filter(condition, true)
    }

    /**
     * Get by host and date
     *
     * @since 0.0.5
     */
    async get(host: string, date: Date | string): Promise<timer.core.Row> {
        const key = generateKey(host, date)
        const exist = await this.storage.getOne<timer.core.Result>(key)
        const result = exist ?? zeroResult()
        return { host, date: formatDateStr(date), ...result }
    }

    /**
     * Delete by key
     *
     * @param rows     site rows, the host and date mustn't be null
     * @since 0.0.9
     */
    async delete(...rows: timer.core.RowKey[]): Promise<void> {
        const keys: string[] = rows.map(({ host, date }) => generateKey(host, date))
        return this.storage.remove(keys)
    }

    async deleteGroup(...rows: [groupId: number, date: string][]): Promise<void> {
        const keys: string[] = rows.map(([groupId, date]) => generateGroupKey(groupId, date))
        return this.storage.remove(keys)
    }

    /**
     * Force update data
     *
     * @since 1.4.3
     */
    forceUpdate(...rows: timer.core.Row[]): Promise<void> {
        const toSet = Object.fromEntries(rows.map(({ host, date, time, focus, run }) => {
            const key = generateKey(host, date)
            const result: timer.core.Result = { time, focus }
            run && (result.run = run)
            return [key, result]
        }))

        return this.storage.set(toSet)
    }

    forceUpdateGroup(...rows: timer.core.Row[]): Promise<void> {
        const toSet = Object.fromEntries(rows.map(({ host, date, time, focus, run }) => {
            const key = generateGroupKey(Number(host), date)
            const result: timer.core.Result = { time, focus }
            run && (result.run = run)
            return [key, result]
        }))

        return this.storage.set(toSet)
    }

    /**
     * @param host host
     * @param range [start date (inclusive), end date (inclusive)]
     * @returns [dates]
     * @since 0.0.7
     */
    async deleteByHost(host: string, range?: [start?: Date | string, end?: Date | string]): Promise<string[]> {
        const [start, end] = range ?? []
        const startStr = start && formatDateStr(start)
        const endStr = end && formatDateStr(end)
        if (startStr && startStr === endStr) {
            // Delete one day
            const key = generateKey(host, start)
            await this.storage.remove(key)
            return [startStr]
        }

        const dateFilter = (date: string) => (startStr ? startStr <= date : true) && (endStr ? date <= endStr : true)
        const items = await this.refresh()

        // Key format: 20201112www.google.com
        const keyReg = generateHostReg(host)
        const keys: string[] = Object.keys(items)
            .filter(key => keyReg.test(key) && dateFilter(key.substring(0, 8)))

        await this.storage.remove(keys)
        return keys.map(k => k.substring(0, 8))
    }

    async deleteByGroup(groupId: number, range?: [start?: Date | string, end?: Date | string]): Promise<void> {
        const [start, end] = range ?? []
        const startStr = start && formatDateStr(start)
        const endStr = end && formatDateStr(end)
        const dateFilter = (date: string) => (startStr ? startStr <= date : true) && (endStr ? date <= endStr : true)
        const items = await this.refresh()

        const keyReg = generateGroupReg(groupId)
        const keys: string[] = Object.keys(items).filter(key => keyReg.test(key) && dateFilter(key.substring(0, 8)))

        await this.storage.remove(keys)
    }
}

/**
 * Legacy data extract
 *
 * @deprecated since 4.0.0, legacy data is not supported for export, this method will be removed in future versions
 */
export function parseImportData(data: unknown): timer.core.Row[] {
    if (typeof data !== "object" || data === null) return []
    const rows: timer.core.Row[] = []
    Object.entries(data)
        .filter(([key]) => /^20\d{2}[01]\d[0-3]\d.*/.test(key) && !key.substring(8).startsWith(GROUP_PREFIX))
        .forEach(([key, value]) => {
            if (typeof value !== "object") return
            if (!isPartialResult(value)) return
            const date = key.substring(0, 8)
            const host = key.substring(8)
            const row: timer.core.Row = { host, date, focus: value.focus ?? 0, time: value.time ?? 0 }
            isNotZeroResult(row) && rows.push(row)
        })
    return rows
}