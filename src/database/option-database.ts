/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { defaultOption } from "@util/constant/option"
import BaseDatabase from "./common/base-database"
import { REMAIN_WORD_PREFIX } from "./common/constant"

const DB_KEY = REMAIN_WORD_PREFIX + 'OPTION'

/**
 * Database of options
 *
 * @since 0.3.0
 */
class OptionDatabase extends BaseDatabase {
    async importData(data: any): Promise<void> {
        const newVal = data[DB_KEY]
        const exist = await this.getOption()
        if (exist) {
            Object.entries(exist).forEach(([key, value]) => (exist as any)[key] = value)
        }
        await this.setOption(newVal)
    }

    async getOption(): Promise<timer.option.AllOption> {
        const option = await this.storage.getOne<timer.option.AllOption>(DB_KEY)
        return option || defaultOption()
    }

    async setOption(option: timer.option.AllOption): Promise<void> {
        option && await this.setByKey(DB_KEY, option)
    }

    /**
     * @since 0.3.2
     */
    addOptionChangeListener(listener: (newVal: timer.option.AllOption) => void) {
        const storageListener = (
            changes: { [key: string]: chrome.storage.StorageChange },
            _areaName: chrome.storage.AreaName,
        ) => {
            const optionInfo = changes[DB_KEY]
            optionInfo && listener(optionInfo.newValue as timer.option.AllOption ?? {})
        }
        chrome.storage.onChanged.addListener(storageListener)
    }
}

const optionDatabase = new OptionDatabase()

export default optionDatabase