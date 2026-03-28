/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { log } from '@/common/logger'
import whitelistDatabase from "@db/whitelist-database"

/**
 * Service of whitelist
 *
 * @since 0.0.5
 */
class WhitelistService {

    add(white: string): Promise<void> {
        log('add to whitelist: ' + white)
        // Just add to the white list, not to delete records since v0.1.1
        return whitelistDatabase.add(white)
    }

    listAll(): Promise<string[]> {
        return whitelistDatabase.selectAll()
    }

    remove(white: string): Promise<void> {
        log('remove whitelist: ' + white)
        return whitelistDatabase.remove(white)
    }
}

export default new WhitelistService()