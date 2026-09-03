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
import type { BrowserMigratable, BrowserMigratableNamespace, StorageMigratable } from '@db/types'
import siteMigrator from '@service/site-service/migrator'

const BROWSER_REGISTRY: Record<BrowserMigratableNamespace, BrowserMigratable> = {
    __stat__: statDatabase,
    __limit__: limitDatabase,
    __merge__: mergeRuleDatabase,
    __site__: siteMigrator,
}

const STORAGE_MIGRATABLES: StorageMigratable<unknown>[] = [
    statDatabase,
]

export async function exportData(): Promise<tt4b.backup.ExportData> {
    const data: tt4b.backup.ExportData = {
        __meta__: { version: packageInfo.version, ts: Date.now() },
    }
    for (const migratable of Object.values(BROWSER_REGISTRY)) {
        const namespace = migratable.namespace
        const dataAny = data as any
        dataAny[namespace] = await migratable.exportData()
    }
    return data
}

export async function importData(data: unknown): Promise<void> {
    for (const db of Object.values(BROWSER_REGISTRY)) await db.importData(data)
}

export async function migrateStorage(type: tt4b.option.StorageType): Promise<void> {
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
