/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { escapeRegExp } from "@util/pattern"
import { isNotZeroResult } from "@util/stat"
import { formatTimeYMD } from "@util/time"
import { log } from "../../common/logger"
import BaseDatabase from "../common/base-database"
import { REMAIN_WORD_PREFIX } from "../common/constant"
import { GROUP_PREFIX } from "./constants"
import { filter } from "./filter"

export type StatCondition = {
    /**
     * Date
     * {y}{m}{d}
     */
    date?: Date | [Date?, Date?]
    /**
     * Focus range, milliseconds
     *
     * @since 0.0.9
     */
    focusRange?: Vector<2>
    /**
     * Time range
     *
     * @since 0.0.9
     */
    timeRange?: [number, number?]
    /**
     * Whether to include virtual sites
     *
     * @since 1.6.1
     */
    virtual?: boolean
    /**
     * Host or groupId, full match
     */
    keys?: string[] | string
}

function increase(a: timer.core.Result, b: timer.core.Result) {
    const res: timer.core.Result = {
        focus: (a?.focus ?? 0) + (b?.focus ?? 0),
        time: (a?.time ?? 0) + (b?.time ?? 0),
    }
    const run = (a?.run ?? 0) + (b?.run ?? 0)
    run && (res.run = run)
    return res
}

function createZeroResult(): timer.core.Result {
    return { focus: 0, time: 0 }
}

function mergeMigration(exist: timer.core.Result | undefined, another: any) {
    exist = exist || createZeroResult()
    return increase(exist, { focus: another.focus ?? 0, time: another.time ?? 0, run: another.run ?? 0 })
}

/**
 * Generate the key in local storage by host and date
 *
 * @param host host
 * @param date date
 */
function generateKey(host: string, date: Date | string) {
    const str = typeof date === 'object' ? formatTimeYMD(date as Date) : date
    return str + host
}

const generateHostReg = (host: string): RegExp => RegExp(`^\\d{8}${escapeRegExp(host)}$`)

function generateGroupKey(groupId: number, date: Date | string) {
    const str = typeof date === 'object' ? formatTimeYMD(date as Date) : date
    return str + GROUP_PREFIX + groupId
}

const generateGroupReg = (groupId: number): RegExp => RegExp(`^\\d{8}${escapeRegExp(`${GROUP_PREFIX}${groupId}`)}$`)

function migrate(exists: { [key: string]: timer.core.Result }, data: any): Record<string, timer.core.Result> {
    const result: Record<string, timer.core.Result> = {}
    Object.entries(data)
        .filter(([key]) => /^20\d{2}[01]\d[0-3]\d.*/.test(key) && !key.substring(8).startsWith(GROUP_PREFIX))
        .forEach(([key, value]) => {
            if (typeof value !== "object") return
            const exist = exists[key]
            const merged = mergeMigration(exist, value)
            merged && isNotZeroResult(merged) && (result[key] = mergeMigration(exist, value))
        })
    return result
}

export class StatDatabase extends BaseDatabase {

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
        let exist = await this.storage.getOne<timer.core.Result>(key)
        exist = increase(exist || createZeroResult(), item)
        await this.setByKey(key, exist)
        return exist
    }

    /**
     * Batch accumulate
     *
     * @param data data: {host=>waste_per_day}
     * @param date date
     * @since 0.1.8
     */
    async accumulateBatch(data: Record<string, timer.core.Result>, date: Date | string): Promise<Record<string, timer.core.Result>> {
        const hosts = Object.keys(data)
        if (!hosts.length) return {}
        const dateStr = typeof date === 'string' ? date : formatTimeYMD(date)
        const keys: { [host: string]: string } = {}
        hosts.forEach(host => keys[host] = generateKey(host, dateStr))

        const items = await this.storage.get(Object.values(keys))

        const toUpdate: Record<string, timer.core.Result> = {}
        const afterUpdated: Record<string, timer.core.Result> = {}
        Object.entries(keys).forEach(([host, key]) => {
            const item = data[host]
            const exist: timer.core.Result = increase(items[key] as timer.core.Result || createZeroResult(), item)
            toUpdate[key] = afterUpdated[host] = exist
        })
        await this.storage.set(toUpdate)
        return afterUpdated
    }

    filter = filter

    /**
     * Select
     *
     * @param condition     condition
     */
    async select(condition?: StatCondition): Promise<timer.core.Row[]> {
        log("select:{condition}", condition)
        const filterResults = await this.filter(condition)
        return filterResults.map(({ date, host, value }) => {
            const { focus, time, run } = value
            return { date, host, focus, time, run }
        })
    }

    async selectGroup(condition?: StatCondition): Promise<timer.core.Row[]> {
        const filterResults = await this.filter(condition, true)
        return filterResults.map(({ date, host, value }) => {
            const { focus, time, run } = value
            return { date, host, focus, time, run }
        })
    }

    /**
     * Get by host and date
     *
     * @since 0.0.5
     */
    async get(host: string, date: Date | string): Promise<timer.core.Result> {
        const key = generateKey(host, date)
        const exist = await this.storage.getOne<timer.core.Result>(key)
        return exist || createZeroResult()
    }

    /**
     * Delete the record
     *
     * @param host host
     * @param date date
     * @since 0.0.5
     */
    async deleteByUrlAndDate(host: string, date: Date | string): Promise<void> {
        const key = generateKey(host, date)
        return this.storage.remove(key)
    }

    async deleteByGroupAndDate(groupId: number, date: Date | string): Promise<void> {
        const key = generateGroupKey(groupId, date)
        return this.storage.remove(key)
    }

    /**
     * Delete by key
     *
     * @param rows     site rows, the host and date mustn't be null
     * @since 0.0.9
     */
    async delete(rows: timer.core.RowKey[]): Promise<void> {
        const keys: string[] = rows.map(({ host, date }) => generateKey(host, date))
        return this.storage.remove(keys)
    }

    async deleteGroup(rows: [groupId: number, date: string][]): Promise<void> {
        const keys: string[] = rows.map(([groupId, date]) => generateGroupKey(groupId, date))
        return this.storage.remove(keys)
    }

    async batchDeleteGroup(groupId: number): Promise<void> {
        const keyReg = generateGroupReg(groupId)
        const items = await this.refresh()
        const keys: string[] = Object.keys(items).filter(key => keyReg.test(key))
        await this.storage.remove(keys)
    }

    /**
     * Force update data
     *
     * @since 1.4.3
     */
    forceUpdate({ host, date, time, focus, run }: timer.core.Row): Promise<void> {
        const key = generateKey(host, date)
        const result: timer.core.Result = { time, focus }
        run && (result.run = run)
        return this.storage.put(key, result)
    }

    /**
     * @param host host
     * @param start start date, inclusive
     * @param end end date, inclusive
     * @since 0.0.7
     */
    async deleteByUrlBetween(host: string, start?: Date, end?: Date): Promise<string[]> {
        const startStr = start ? formatTimeYMD(start) : undefined
        const endStr = end ? formatTimeYMD(end) : undefined
        const dateFilter = (date: string) => (startStr ? startStr <= date : true) && (endStr ? date <= endStr : true)
        const items = await this.refresh()

        // Key format: 20201112www.google.com
        const keyReg = generateHostReg(host)
        const keys: string[] = Object.keys(items)
            .filter(key => keyReg.test(key) && dateFilter(key.substring(0, 8)))

        await this.storage.remove(keys)
        return keys.map(k => k.substring(0, 8))
    }

    async deleteByGroupBetween(groupId: number, start?: Date, end?: Date): Promise<void> {
        const startStr = start ? formatTimeYMD(start) : undefined
        const endStr = end ? formatTimeYMD(end) : undefined
        const dateFilter = (date: string) => (startStr ? startStr <= date : true) && (endStr ? date <= endStr : true)
        const items = await this.refresh()

        const keyReg = generateGroupReg(groupId)
        const keys: string[] = Object.keys(items).filter(key => keyReg.test(key) && dateFilter(key.substring(0, 8)))

        await this.storage.remove(keys)
    }

    /**
     * Delete the record
     *
     * @param host host
     * @since 0.0.5
     */
    async deleteByUrl(host: string): Promise<string[]> {
        const items = await this.refresh()

        // Key format: 20201112www.google.com
        const keyReg = generateHostReg(host)
        const keys: string[] = Object.keys(items).filter(key => keyReg.test(key))
        await this.storage.remove(keys)

        return keys.map(k => k.substring(0, 8))
    }

    async deleteByGroup(groupId: number): Promise<void> {
        const items = await this.refresh()
        const keyReg = generateGroupReg(groupId)
        const keys: string[] = Object.keys(items).filter(key => keyReg.test(key))
        await this.storage.remove(keys)
    }

    async importData(data: any): Promise<void> {
        if (typeof data !== "object") return
        const items = await this.storage.get()
        const toSave = migrate(items, data)
        this.storage.set(toSave)
    }
}

const statDatabase = new StatDatabase()

export default statDatabase
