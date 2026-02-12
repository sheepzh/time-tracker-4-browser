/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { extractNamespace, isExportData, isLegacyVersion } from '@db/common/migratable'
import type { BrowserMigratable, StorageMigratable } from '@db/types'
import optionHolder from '@service/components/option-holder'
import { isOptionalInt } from '@util/guard'
import { isNotZeroResult } from '@util/stat'
import { createArrayGuard, createObjectGuard, isString } from 'typescript-guard'
import { ClassicStatDatabase } from './classic'
import { IDBStatDatabase } from './idb'
import type { StatCondition, StatDatabase } from './types'

type StateDatabaseComposite =
    & StatDatabase
    & StorageMigratable<timer.core.Row[]>
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

class StatDatabaseWrapper implements StateDatabaseComposite {
    namespace: '__stat__' = '__stat__'
    private classic = new ClassicStatDatabase()
    private indexedDb = new IDBStatDatabase()
    private current: StatDatabase = this.classic

    constructor() {
        optionHolder.get().then(val => this.handleOption(val))
        optionHolder.addChangeListener(val => this.handleOption(val))
    }

    get(host: string, date: Date | string): Promise<timer.core.Result> {
        return this.current.get(host, date)
    }

    select(condition?: StatCondition): Promise<timer.core.Row[]> {
        return this.current.select(condition)
    }

    accumulate(host: string, date: Date | string, item: timer.core.Result): Promise<timer.core.Result> {
        return this.current.accumulate(host, date, item)
    }

    batchAccumulate(data: Record<string, timer.core.Result>, date: Date | string): Promise<Record<string, timer.core.Result>> {
        return this.current.batchAccumulate(data, date)
    }

    accumulateGroup(groupId: number, date: Date | string, item: timer.core.Result): Promise<timer.core.Result> {
        return this.current.accumulateGroup(groupId, date, item)
    }

    delete(...rows: timer.core.RowKey[]): Promise<void> {
        return this.current.delete(...rows)
    }

    deleteByHost(host: string, range?: [start?: Date | string, end?: Date | string]): Promise<string[]> {
        return this.current.deleteByHost(host, range)
    }

    selectGroup(condition?: StatCondition): Promise<timer.core.Row[]> {
        return this.current.selectGroup(condition)
    }

    deleteGroup(...rows: [groupId: number, date: string][]): Promise<void> {
        return this.current.deleteGroup(...rows)
    }

    deleteByGroup(groupId: number, range: [start?: Date | string, end?: Date | string]): Promise<void> {
        return this.current.deleteByGroup(groupId, range)
    }

    forceUpdate(...rows: timer.core.Row[]): Promise<void> {
        return this.current.forceUpdate(...rows)
    }

    private handleOption(option: timer.option.TrackingOption) {
        const storage = this.judgeDb(option.storage)
        storage && (this.current = storage)
    }

    private judgeDb(type: timer.option.StorageType): StatDatabase | null {
        if (type === 'indexed_db') {
            return this.indexedDb
        } else if (type = 'classic') {
            return this.classic
        } else {
            return null
        }
    }

    async migrateStorage(type: timer.option.StorageType): Promise<timer.core.Row[]> {
        const target = this.judgeDb(type)
        if (!target) return []
        const all = await this.select()
        await target.forceUpdate(...all)
        return all
    }

    async afterStorageMigrated(allData: timer.core.Row[]): Promise<void> {
        await this.current.delete(...allData)
    }

    async importData(data: unknown): Promise<void> {
        const rows = this.parseImportRows(data)
        await this.forceUpdate(...rows)
    }

    async exportData(): Promise<timer.core.Row[]> {
        return this.select()
    }

    private parseImportRows(data: unknown): timer.core.Row[] {
        if (!isExportData(data)) return []
        if (isLegacyVersion(data)) {
            return this.classic.parseImportData(data)
        }

        if (!(this.namespace in data)) return []

        const nsData = extractNamespace(data, this.namespace, createArrayGuard(isValidImportRow)) ?? []
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
