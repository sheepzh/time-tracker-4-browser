/**
 * Migrate data among storages (chrome.storage.local / IndexedDB)
 *
 * @since 4.0.0
 */
export interface StorageMigratable<AllData> {
    /**
     * Migrate data to target storage
     *
     * NOTE: MUST NOT change the inner storage type
     *
     * @param type the type of target storage
     */
    migrateStorage(type: timer.option.StorageType): Promise<AllData>
    /**
     * Handler after migration finished. Clean the old data here
     *
     * @param allData
     */
    afterStorageMigrated(allData: AllData): Promise<void>
}

export type BrowserMigratableNamespace = keyof Omit<timer.backup.ExportData, '__meta__'>

/**
 * Migrate data among browsers (export / import)
 */
export interface BrowserMigratable<N = BrowserMigratableNamespace> {
    /**
     * The name space for migration
     */
    namespace: N
    exportData(): Promise<Required<timer.backup.ExportData>[N]>
    importData(data: unknown): Promise<void>
}