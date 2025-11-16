/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import BaseDatabase from "./common/base-database"
import { WHITELIST_KEY } from "./common/constant"

class WhitelistDatabase extends BaseDatabase {

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

    async importData(data: any): Promise<void> {
        const toMigrate = data[WHITELIST_KEY]
        if (!Array.isArray(toMigrate)) return
        const exist = await this.selectAll()
        toMigrate.forEach(white => !exist.includes(white) && exist.push(white))
        await this.update(exist)
    }
}

const whitelistDatabase = new WhitelistDatabase()

export default whitelistDatabase