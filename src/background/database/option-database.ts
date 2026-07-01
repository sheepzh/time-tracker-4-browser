/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { defaultOption } from "@util/constant/option"
import { mergeObject } from '@util/lang'
import BaseDatabase from "./common/base-database"
import { REMAIN_WORD_PREFIX } from "./common/constant"
import StoragePromise from './common/storage-promise'

const DB_KEY = REMAIN_WORD_PREFIX + 'OPTION'

/**
 * Database of options
 *
 * @since 0.3.0
 */
class OptionDatabase extends BaseDatabase {
    #sync: StoragePromise = new StoragePromise(chrome.storage.sync)

    async getOption(): Promise<tt4b.option.DefaultOption> {
        const option = await this.storage.getOne<tt4b.option.AllOption>(DB_KEY)
        return mergeObject<tt4b.option.DefaultOption>(defaultOption(), option)
    }

    async setOption(option: tt4b.option.AllOption): Promise<void> {
        option && await this.setByKey(DB_KEY, option)
    }

    async sync(): Promise<void> {
        await this.#copy(this.storage, this.#sync)
    }

    async download(): Promise<void> {
        await this.#copy(this.#sync, this.storage)
    }

    async #copy(from: StoragePromise, to: StoragePromise): Promise<void> {
        const value = await from.getOne<tt4b.option.AllOption>(DB_KEY)
        return value ? to.put(DB_KEY, value) : to.remove(DB_KEY)
    }
}

const optionDatabase = new OptionDatabase()

export default optionDatabase