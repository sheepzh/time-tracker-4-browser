/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

type StorageArea = chrome.storage.StorageArea

/**
 * Wrap the storage with promise
 */
export default class StoragePromise {
    private storage: StorageArea | undefined

    constructor(storage?: StorageArea) {
        this.storage = storage
    }

    private getStorage(): StorageArea {
        return this.storage ?? chrome.storage.local
    }

    get<T = { [key: string]: any }>(keys?: Parameters<StorageArea['get']>[0]): Promise<T> {
        return new Promise(resolve => this.getStorage().get(keys ?? null, resolve))
    }

    /**
     * @since 0.5.0
     */
    async getOne<T>(key: string): Promise<T | undefined> {
        return (await this.get(key))[key] as T
    }

    set(obj: any): Promise<void> {
        return new Promise<void>(resolve => this.getStorage().set(obj, resolve))
    }

    /**
     * @since 0.5.0
     */
    put(key: string, val: unknown): Promise<void> {
        return this.set({ [key]: val })
    }

    remove(key: string | string[]): Promise<void> {
        return new Promise(resolve => this.getStorage().remove(key, resolve))
    }

    async getUsedMemory(): Promise<number> {
        if (this.getStorage().getBytesInUse) {
            return new Promise(resolve => this.getStorage().getBytesInUse(resolve))
        } else {
            const store = await this.get()
            return JSON.stringify(store).length
        }
    }
}