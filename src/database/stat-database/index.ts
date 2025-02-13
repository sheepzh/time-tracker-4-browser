/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { escapeRegExp } from "@util/pattern"
import { createZeroResult, isNotZeroResult, mergeResult } from "@util/stat"
import { formatTimeYMD } from "@util/time"
import { log } from "../../common/logger"
import BaseDatabase from "../common/base-database"
import { REMAIN_WORD_PREFIX } from "../common/constant"
import { filter } from "./filter"

export type StatCondition = {
    /**
     * Date
     * {y}{m}{d}
     */
    date?: Date | [Date, Date?]
    /**
     * Host name for query
     */
    host?: string
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
    timeRange?: Vector<2>
    /**
     * Whether to enable full host search, default is false
     *
     * @since 0.0.8
     */
    fullHost?: boolean
    /**
     * Whether to exclusive virtual sites
     *
     * @since 1.6.1
     */
    exclusiveVirtual?: boolean
}

function mergeMigration(exist: timer.core.Result | undefined, another: any) {
    exist = exist || createZeroResult()
    return mergeResult(exist, { focus: another.focus ?? 0, time: another.time ?? 0, run: another.run ?? 0 })
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

function migrate(exists: { [key: string]: timer.core.Result }, data: any): { [key: string]: timer.core.Result } {
    const result = {}
    Object.entries(data)
        .filter(([key]) => /^20\d{2}[01]\d[0-3]\d.*/.test(key))
        .forEach(([key, value]) => {
            if (typeof value !== "object") return
            const exist = exists[key]
            const merged = mergeMigration(exist, value)
            merged && isNotZeroResult(merged) && (result[key] = mergeMigration(exist, value))
        })
    return result
}

class StatDatabase extends BaseDatabase {

    async refresh(): Promise<{ [key: string]: unknown }> {
        const result = await this.storage.get()
        const items = {}
        Object.entries(result)
            .filter(([key]) => !key.startsWith(REMAIN_WORD_PREFIX))
            .forEach(([key, value]) => items[key] = value)
        return items
    }

    /**
     * @param host host
     * @since 0.1.3
     */
    async accumulate(host: string, date: Date | string, item: timer.core.Result): Promise<timer.core.Result> {
        const key = generateKey(host, date)
        let exist = await this.storage.getOne<timer.core.Result>(key)
        exist = mergeResult(exist || createZeroResult(), item)
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
    async accumulateBatch(data: timer.stat.ResultSet, date: Date | string): Promise<timer.stat.ResultSet> {
        const hosts = Object.keys(data)
        if (!hosts.length) return
        const dateStr = typeof date === 'string' ? date : formatTimeYMD(date)
        const keys: { [host: string]: string } = {}
        hosts.forEach(host => keys[host] = generateKey(host, dateStr))

        const items = await this.storage.get(Object.values(keys))

        const toUpdate = {}
        const afterUpdated: timer.stat.ResultSet = {}
        Object.entries(keys).forEach(([host, key]) => {
            const item = data[host]
            const exist: timer.core.Result = mergeResult(items[key] as timer.core.Result || createZeroResult(), item)
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

    /**
     * Count by condition
     *
     * @param condition
     * @returns count
     * @since 1.0.2
     */
    async count(condition: StatCondition): Promise<number> {
        log("select:{condition}", condition)
        const filterResults = await this.filter(condition)
        return filterResults.length || 0
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

    /**
     * Delete by key
     *
     * @param rows     site rows, the host and date mustn't be null
     * @since 0.0.9
     */
    async delete(rows: timer.core.RowKey[]): Promise<void> {
        const keys: string[] = rows.filter(({ date, host }) => !!host && !!date).map(({ host, date }) => generateKey(host, date))
        return this.storage.remove(keys)
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
        const keyReg = RegExp('\\d{8}' + escapeRegExp(host))
        const keys: string[] = Object.keys(items)
            .filter(key => keyReg.test(key) && dateFilter(key.substring(0, 8)))

        await this.storage.remove(keys)
        return keys.map(k => k.substring(0, 8))
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
        const keyReg = RegExp('\\d{8}' + escapeRegExp(host))
        const keys: string[] = Object.keys(items).filter(key => keyReg.test(key))
        await this.storage.remove(keys)

        return keys.map(k => k.substring(0, 8))
    }

    async importData(data: any): Promise<void> {
        if (typeof data !== "object") return
        const items = await this.storage.get()
        const toSave = migrate(items, data)
        this.storage.set(toSave)
    }
}

export default StatDatabase
