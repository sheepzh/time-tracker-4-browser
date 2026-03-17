/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getDateString, keyOf } from "@util/period"
import BaseDatabase from "./common/base-database"
import { REMAIN_WORD_PREFIX } from "./common/constant"

/**
 * order => milliseconds of focus
 */
type DailyResult = Record<string, number>

const KEY_PREFIX = REMAIN_WORD_PREFIX + 'PERIOD'
const KEY_PREFIX_LENGTH = KEY_PREFIX.length
const generateKey = (date: string) => KEY_PREFIX + date

function merge(exists: { [dateKey: string]: DailyResult }, toMerge: timer.period.Result[]) {
    toMerge.forEach(period => {
        const { order, milliseconds } = period
        const key = generateKey(getDateString(period))
        const exist = exists[key] || {}
        const previous = exist[order] || 0
        exist[order] = previous + milliseconds
        exists[key] = exist
    })
}

function db2PeriodInfos(data: { [dateKey: string]: DailyResult }): timer.period.Result[] {
    const result: timer.period.Result[] = []
    Object.entries(data).forEach((([dateKey, val]) => {
        const dateStr = dateKey.substring(KEY_PREFIX_LENGTH)
        const date = new Date(
            Number.parseInt(dateStr.substring(0, 4)),
            Number.parseInt(dateStr.substring(4, 6)) - 1,
            Number.parseInt(dateStr.substring(6, 8))
        )
        Object
            .entries(val)
            .forEach(([order, milliseconds]) => result.push({
                ...keyOf(date, Number.parseInt(order)),
                milliseconds
            }))
    }))
    return result
}
/**
 * @since v0.2.1
 * @deprecated
 *  Starting with v4, all timeline data will be stored in IndexedDB, and periodic results will be queried using the timeline database.
 *  Therefore, this will be removed one year after the release of version 4 (around 2027-04-01)
 */
class PeriodDatabase extends BaseDatabase {

    async get(date: string): Promise<DailyResult> {
        const key = generateKey(date)
        const result = await this.storage.getOne<DailyResult>(key)
        return result || {}
    }

    async accumulate(items: timer.period.Result[]): Promise<void> {
        const dates = Array.from(new Set(items.map(getDateString)))
        const exists = await this.getBatch0(dates)
        merge(exists, items)
        await this.updateBatch(exists)
    }

    private updateBatch(data: { [dateKey: string]: DailyResult }): Promise<void> {
        return this.storage.set(data)
    }

    /**
     * Used by self
     */
    private getBatch0(dates: string[]): Promise<{ [dateKey: string]: DailyResult }> {
        const keys = dates.map(generateKey)
        return this.storage.get(keys)
    }

    async getBatch(dates: string[]): Promise<timer.period.Result[]> {
        const data = await this.getBatch0(dates)
        return db2PeriodInfos(data)
    }

    /**
     * @since 1.0.0
     * @returns all period items
     */
    async getAll(): Promise<timer.period.Result[]> {
        const allItems = await this.storage.get()
        const periodItems: { [dateKey: string]: DailyResult } = {}
        Object.entries(allItems)
            .filter(([key]) => key.startsWith(KEY_PREFIX))
            .forEach(([key, val]) => periodItems[key] = val)
        return db2PeriodInfos(periodItems)
    }

    async batchDelete(dates: string[]) {
        const keys = dates.map(generateKey)
        await this.storage.remove(keys)
    }

}

const periodDatabase = new PeriodDatabase()

export default periodDatabase