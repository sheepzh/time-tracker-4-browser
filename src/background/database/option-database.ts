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

const DB_KEY = REMAIN_WORD_PREFIX + 'OPTION'

/**
 * Database of options
 *
 * @since 0.3.0
 */
class OptionDatabase extends BaseDatabase {

    async getOption(): Promise<timer.option.AllOption> {
        const option = await this.storage.getOne<timer.option.AllOption>(DB_KEY)
        return mergeObject(defaultOption(), option)
    }

    async setOption(option: timer.option.AllOption): Promise<void> {
        option && await this.setByKey(DB_KEY, option)
    }
}

const optionDatabase = new OptionDatabase()

export default optionDatabase