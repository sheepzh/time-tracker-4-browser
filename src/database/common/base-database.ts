/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import StoragePromise from "./storage-promise"

export default abstract class BaseDatabase {

    storage: StoragePromise

    constructor(storageArea?: chrome.storage.StorageArea) {
        this.storage = new StoragePromise(storageArea)
    }

    /**
     * @since 0.2.2
     * @param key key
     * @param val data
     * @returns
     */
    protected setByKey(key: string, val: any): Promise<void> {
        return this.storage.put(key, val)
    }
}