/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import BaseDatabase from "./common/base-database"
import { REMAIN_WORD_PREFIX } from "./common/constant"

const PREFIX = REMAIN_WORD_PREFIX + "backup"
const SNAPSHOT_KEY = PREFIX + "_snap"
const CACHE_KEY = PREFIX + "_cache"

function cacheKeyOf(type: timer.backup.Type) {
    return CACHE_KEY + "_" + type
}

class BackupDatabase extends BaseDatabase {

    async getSnapshot(type: timer.backup.Type): Promise<timer.backup.Snapshot | undefined> {
        const cache = await this.storage.getOne<timer.backup.SnapshotCache>(SNAPSHOT_KEY)
        return cache?.[type]
    }

    async updateSnapshot(type: timer.backup.Type, snapshot: timer.backup.Snapshot): Promise<void> {
        const cache = await this.storage.getOne<timer.backup.SnapshotCache>(SNAPSHOT_KEY) || {}
        cache[type] = snapshot
        await this.storage.put(SNAPSHOT_KEY, cache)
    }

    async getCache(type: timer.backup.Type): Promise<unknown> {
        return (await this.storage.getOne(cacheKeyOf(type))) || {}
    }

    async updateCache(type: timer.backup.Type, newVal: unknown): Promise<void> {
        return this.storage.put(cacheKeyOf(type), newVal as Object)
    }
}

const backupDatabase = new BackupDatabase()

export default backupDatabase