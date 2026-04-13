/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import packageInfo from "@/package"
import limitDatabase from "@db/limit-database"
import mergeRuleDatabase from "@db/merge-rule-database"
import statDatabase from "@db/stat-database"
import type { BrowserMigratable, StorageMigratable } from '@db/types'
import whitelistDatabase from "@db/whitelist-database"

const BROWSER_MIGRATABLES: BrowserMigratable[] = [
    statDatabase,
    limitDatabase,
    mergeRuleDatabase,
    whitelistDatabase,
]

const STORAGE_MIGRATABLES: StorageMigratable<unknown>[] = [
    statDatabase,
]

export async function exportData(): Promise<timer.backup.ExportData> {
    const data: timer.backup.ExportData = {
        __meta__: { version: packageInfo.version, ts: Date.now() },
    }
    for (const migratable of BROWSER_MIGRATABLES) {
        const namespace = migratable.namespace
        const dataAny = data as any
        dataAny[namespace] = await migratable.exportData()
    }
    return data
}

export async function importData(data: unknown): Promise<void> {
    for (const db of BROWSER_MIGRATABLES) await db.importData(data)
}

export async function migrateStorage(type: timer.option.StorageType): Promise<void> {
    const dataList: unknown[] = []
    // 1. migrate all the databases firstly
    for (const migratable of STORAGE_MIGRATABLES) {
        const data = await migratable.migrateStorage(type)
        dataList.push(data)
    }
    // 2. after migration
    for (const migratable of STORAGE_MIGRATABLES) {
        const [data] = dataList.splice(0, 1)
        await migratable.afterStorageMigrated(data)
    }
}
