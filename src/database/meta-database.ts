/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import BaseDatabase from "./common/base-database"
import { META_KEY } from "./common/constant"

/**
 * @since 0.6.0
 */
class MetaDatabase extends BaseDatabase {
    async getMeta(): Promise<timer.ExtensionMeta> {
        const meta = await this.storage.getOne<timer.ExtensionMeta>(META_KEY)
        return meta || {}
    }

    async update(existMeta: timer.ExtensionMeta): Promise<void> {
        await this.storage.put(META_KEY, existMeta)
    }
}

const metaDatabase = new MetaDatabase()

export default metaDatabase