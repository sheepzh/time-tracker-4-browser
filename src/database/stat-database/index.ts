/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { extractNamespace, isExportData, isLegacyVersion } from '@db/common/migratable'
import { StorageHolder } from '@db/common/storage-holder'
import type { BrowserMigratable, StorageMigratable } from '@db/types'
import { isOptionalInt } from '@util/guard'
import { isNotZeroResult } from '@util/stat'
import { createArrayGuard, createObjectGuard, isString } from 'typescript-guard'
import { ClassicStatDatabase, parseImportData } from './classic'
import { IDBStatDatabase } from './idb'
import type { StatCondition, StatDatabase } from './types'

type StateDatabaseComposite =
    & StatDatabase
    & StorageMigratable<[tabs: timer.core.Row[], groups: timer.core.Row[]]>
    & BrowserMigratable<'__stat__'>

// Only `date` and `host` are required for import, other fields are optional, and will be set to default if not provided
type ValidImportRow = MakeRequired<Partial<timer.core.Row>, 'date' | 'host'>

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
    private current = () => this.holder.current

    get(host: string, date: Date | string): Promise<timer.core.Result> {
        return this.current().get(host, date)
    }

    select(condition?: StatCondition): Promise<timer.core.Row[]> {
        return this.current().select(condition)
    }

    accumulate(host: string, date: Date | string, item: timer.core.Result): Promise<timer.core.Result> {
        return this.current().accumulate(host, date, item)
    }

    batchAccumulate(data: Record<string, timer.core.Result>, date: Date | string): Promise<Record<string, timer.core.Result>> {
        return this.current().batchAccumulate(data, date)
    }

    accumulateGroup(groupId: number, date: Date | string, item: timer.core.Result): Promise<timer.core.Result> {
        return this.current().accumulateGroup(groupId, date, item)
    }

    delete(...rows: timer.core.RowKey[]): Promise<void> {
        return this.current().delete(...rows)
    }

    deleteByHost(host: string, range?: [start?: Date | string, end?: Date | string]): Promise<string[]> {
        return this.current().deleteByHost(host, range)
    }

    selectGroup(condition?: StatCondition): Promise<timer.core.Row[]> {
        return this.current().selectGroup(condition)
    }

    deleteGroup(...rows: [groupId: number, date: string][]): Promise<void> {
        return this.current().deleteGroup(...rows)
    }

    deleteByGroup(groupId: number, range: [start?: Date | string, end?: Date | string]): Promise<void> {
        return this.current().deleteByGroup(groupId, range)
    }

    forceUpdate(...rows: timer.core.Row[]): Promise<void> {
        return this.current().forceUpdate(...rows)
    }

    forceUpdateGroup(...rows: timer.core.Row[]): Promise<void> {
        return this.current().forceUpdateGroup(...rows)
    }


    async migrateStorage(type: timer.option.StorageType): Promise<[timer.core.Row[], timer.core.Row[]]> {
        const target = this.holder.get(type)
        if (!target) return [[], []]
        const tabs = await this.select({ virtual: true })
        await target.forceUpdate(...tabs)
        const groups = await this.selectGroup()
        await target.forceUpdateGroup(...groups)
        return [tabs, groups]
    }

    async afterStorageMigrated([tabs, groups]: [timer.core.Row[], timer.core.Row[]]): Promise<void> {
        await this.current().delete(...tabs)
        const groupKeys = groups.map(({ host, date }) => [parseInt(host), date] satisfies [number, string])
        await this.current().deleteGroup(...groupKeys)
    }

    async importData(data: unknown): Promise<void> {
        const rows = this.parseImportRows(data)
        await this.forceUpdate(...rows)
    }

    async exportData(): Promise<timer.core.Row[]> {
        return this.select({ virtual: true })
    }

    private parseImportRows(data: unknown): timer.core.Row[] {
        if (!isExportData(data)) return []
        if (isLegacyVersion(data)) {
            return parseImportData(data) ?? []
        }

        if (!(this.namespace in data)) return []

        const nsData = extractNamespace(data, this.namespace, isValidImportRows) ?? []
        const rows: timer.core.Row[] = []
        for (const item of nsData) {
            const row: timer.core.Row = {
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
