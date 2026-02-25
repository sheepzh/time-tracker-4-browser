/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import limitDatabase from "@db/limit-database"
import mergeRuleDatabase from "@db/merge-rule-database"
import statDatabase from "@db/stat-database"
import type { BrowserMigratable, StorageMigratable } from '@db/types'
import whitelistDatabase from "@db/whitelist-database"
import packageInfo from "@src/package"

/**
 * Data export/import and storage migration
 *
 * @since 0.2.5
 */
class Immigration {
    private browserMigratables: BrowserMigratable<string>[]
    private storageMigratables: StorageMigratable<unknown>[]

    constructor() {
        this.browserMigratables = [
            statDatabase,
            limitDatabase,
            mergeRuleDatabase,
            whitelistDatabase,
        ]
        this.storageMigratables = [
            statDatabase,
        ]
    }

    async exportData(): Promise<timer.backup.ExportData> {
        const data: timer.backup.ExportData = {
            __meta__: { version: packageInfo.version, ts: Date.now() },
        }
        for (const migratable of this.browserMigratables) {
            const namespace = migratable.namespace
            const exportData = await migratable.exportData()
            data[namespace] = exportData
        }
        return data
    }

    async importData(data: unknown): Promise<void> {
        for (const db of this.browserMigratables) await db.importData(data)
    }

    async migrateStorage(type: timer.option.StorageType): Promise<void> {
        const dataList: unknown[] = []
        // 1. migrate all the databases firstly
        for (const migratable of this.storageMigratables) {
            const data = await migratable.migrateStorage(type)
            dataList.push(data)
        }
        // 2. after migration
        for (const migratable of this.storageMigratables) {
            const [data] = dataList.splice(0, 1)
            await migratable.afterStorageMigrated(data)
        }
    }
}

export default new Immigration()