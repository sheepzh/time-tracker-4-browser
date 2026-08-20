/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import BaseDatabase from "./common/base-database"
import { WHITELIST_KEY } from "./common/constant"

/**
 * @deprecated whitelist has been moved to the options of site
 */
class WhitelistDatabase extends BaseDatabase {

    async selectAll(): Promise<string[]> {
        const exist = await this.storage.getOne<string[]>(WHITELIST_KEY)
        return exist || []
    }

    async clear(): Promise<void> {
        return this.storage.remove(WHITELIST_KEY)
    }
}

const whitelistDatabase = new WhitelistDatabase()

export default whitelistDatabase