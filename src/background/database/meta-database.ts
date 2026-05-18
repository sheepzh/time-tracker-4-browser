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
    async getMeta(): Promise<tt4b.ExtensionMeta> {
        const meta = await this.storage.getOne<tt4b.ExtensionMeta>(META_KEY)
        return meta || {}
    }

    async update(existMeta: tt4b.ExtensionMeta): Promise<void> {
        await this.storage.put(META_KEY, existMeta)
    }
}

const metaDatabase = new MetaDatabase()

export default metaDatabase