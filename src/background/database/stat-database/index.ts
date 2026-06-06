/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isNotZeroResult } from '@util/stat'
import { createArrayGuard, createObjectGuard, isOptionalInt, isString } from 'typescript-guard'
import { extractNamespace, isExportData, isLegacyVersion } from '../common/migratable'
import { StorageHolder } from '../common/storage-holder'
import type { BrowserMigratable, StorageMigratable } from '../types'
import { ClassicStatDatabase, parseImportData } from './classic'
import { IDBStatDatabase } from './idb'
import type { StatCondition, StatDatabase } from './types'

type StateDatabaseComposite =
    & StatDatabase
    & StorageMigratable<[tabs: tt4b.core.Row[], groups: tt4b.core.Row[]]>
    & BrowserMigratable<'__stat__'>

// Only `date` and `host` are required for import, other fields are optional, and will be set to default if not provided
type ValidImportRow = MakeRequired<Partial<tt4b.core.Row>, 'date' | 'host'>

const isValidImportRow = createObjectGuard<ValidImportRow>({
    focus: isOptionalInt,
    time: isOptionalInt,
    run: isOptionalInt,
    date: isString,
    host: isString,
})

const isValidImportRows = createArrayGuard(isValidImportRow)

class StatDatabaseWrapper implements StateDatabaseComposite {
    namespace: '__stat__' = '__stat__'
    private holder = new StorageHolder<StatDatabase>({
        classic: new ClassicStatDatabase(),
        indexed_db: new IDBStatDatabase(),
    })

    get #current() {
        return this.holder.current
    }

    get(host: string, date: Date): Promise<tt4b.core.Row> {
        return this.#current.get(host, date)
    }

    batchSelect(keys: tt4b.core.RowKey[]): Promise<tt4b.core.Row[]> {
        return this.#current.batchSelect(keys)
    }

    select(condition?: StatCondition): Promise<tt4b.core.Row[]> {
        return this.#current.select(condition)
    }

    accumulate(host: string, date: Date | string, item: tt4b.core.Result): Promise<tt4b.core.Result> {
        return this.#current.accumulate(host, date, item)
    }

    batchAccumulate(data: Record<string, tt4b.core.Result>, date: Date | string): Promise<Record<string, tt4b.core.Result>> {
        return this.#current.batchAccumulate(data, date)
    }

    accumulateGroup(groupId: number, date: Date | string, item: tt4b.core.Result): Promise<tt4b.core.Result> {
        return this.#current.accumulateGroup(groupId, date, item)
    }

    delete(...rows: tt4b.core.RowKey[]): Promise<void> {
        return this.#current.delete(...rows)
    }

    deleteByHost(host: string, range?: string | [string, string]): Promise<void> {
        return this.#current.deleteByHost(host, range)
    }

    deleteByGroup(groupId: number, range?: string | [string, string]): Promise<void> {
        return this.#current.deleteByGroup(groupId, range)
    }

    selectGroup(condition?: StatCondition): Promise<tt4b.core.Row[]> {
        return this.#current.selectGroup(condition)
    }

    deleteGroup(...rows: [groupId: number, date: string][]): Promise<void> {
        return this.#current.deleteGroup(...rows)
    }

    forceUpdate(...rows: tt4b.core.Row[]): Promise<void> {
        return this.#current.forceUpdate(...rows)
    }

    forceUpdateGroup(...rows: tt4b.core.Row[]): Promise<void> {
        return this.#current.forceUpdateGroup(...rows)
    }

    async migrateStorage(type: tt4b.option.StorageType): Promise<[tt4b.core.Row[], tt4b.core.Row[]]> {
        const target = this.holder.get(type)
        if (!target) return [[], []]
        const tabs = await this.select({ virtual: true })
        await target.forceUpdate(...tabs)
        const groups = await this.selectGroup()
        await target.forceUpdateGroup(...groups)
        return [tabs, groups]
    }

    async afterStorageMigrated([tabs, groups]: [tt4b.core.Row[], tt4b.core.Row[]]): Promise<void> {
        await this.#current.delete(...tabs)
        const groupKeys = groups.map(({ host, date }) => [parseInt(host), date] satisfies [number, string])
        await this.#current.deleteGroup(...groupKeys)
    }

    async importData(data: unknown): Promise<void> {
        const rows = this.parseImportRows(data)
        await this.#current.forceUpdate(...rows)
    }

    async exportData(): Promise<tt4b.core.Row[]> {
        return this.#current.select({ virtual: true })
    }

    private parseImportRows(data: unknown): tt4b.core.Row[] {
        if (!isExportData(data)) return []
        if (isLegacyVersion(data)) {
            return parseImportData(data) ?? []
        }

        if (!(this.namespace in data)) return []

        const nsData = extractNamespace(data, this.namespace, isValidImportRows) ?? []
        const rows: tt4b.core.Row[] = []
        for (const item of nsData) {
            const row: tt4b.core.Row = {
                host: item.host,
                date: item.date,
                time: item.time ?? 0,
                focus: item.focus ?? 0,
                run: item.run ?? 0,
            }
            isNotZeroResult(row) && rows.push(row)
        }
        return rows
    }
}

const statDatabase: StateDatabaseComposite = new StatDatabaseWrapper()

export default statDatabase

export * from "./types"
