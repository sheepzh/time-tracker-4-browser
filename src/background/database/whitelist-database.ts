/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { isStringArray } from 'typescript-guard'
import BaseDatabase from "./common/base-database"
import { WHITELIST_KEY } from "./common/constant"
import { extractNamespace, isExportData, isLegacyVersion } from './common/migratable'
import type { BrowserMigratable } from './types'

class WhitelistDatabase extends BaseDatabase implements BrowserMigratable<'__whitelist__'> {
    namespace: '__whitelist__' = '__whitelist__'

    private async update(toUpdate: string[]): Promise<void> {
        await this.setByKey(WHITELIST_KEY, toUpdate || [])
    }

    async selectAll(): Promise<string[]> {
        const exist = await this.storage.getOne<string[]>(WHITELIST_KEY)
        return exist || []
    }

    async add(white: string): Promise<void> {
        const exist = await this.selectAll()
        if (exist.includes(white)) return
        await this.update([...exist, white])
    }

    async remove(white: string): Promise<void> {
        const exist = await this.selectAll()
        const toUpdate = exist?.filter?.(w => w !== white) || []
        return await this.update(toUpdate)
    }

    async exist(white: string): Promise<boolean> {
        const exist = await this.selectAll()
        return exist?.includes(white)
    }

    /**
     * Add listener to listen changes
     *
     * @since 0.1.9
     */
    addChangeListener(listener: (whitelist: string[]) => void) {
        const storageListener = (
            changes: { [key: string]: chrome.storage.StorageChange },
            _areaName: chrome.storage.AreaName,
        ) => {
            const changeInfo = changes[WHITELIST_KEY]
            const newValue = changeInfo?.newValue
            const whitelists: string[] = Array.isArray(newValue) ? newValue.map(n => new String(n).toString()) : []
            changeInfo && listener(whitelists)
        }
        chrome.storage.onChanged.addListener(storageListener)
    }

    async importData(data: unknown): Promise<void> {
        if (!isExportData(data)) return
        const toImport = isLegacyVersion(data)
            ? this.parseLegacyData(data)
            : extractNamespace(data, this.namespace, isStringArray)

        const exist = await this.selectAll()
        toImport?.forEach(white => !exist.includes(white) && exist.push(white))

        await this.update(exist)
    }

    /**
     * @deprecated Only for legacy data, will be removed in future version
     */
    private parseLegacyData(data: timer.backup.ExportData): string[] {
        const toMigrate = data[WHITELIST_KEY]
        return isStringArray(toMigrate) ? toMigrate : []
    }

    exportData(): Promise<string[]> {
        return this.selectAll()
    }
}

const whitelistDatabase = new WhitelistDatabase()

export default whitelistDatabase