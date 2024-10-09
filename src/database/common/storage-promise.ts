/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

/**
 * Copy from chrome.storage
 */
type NoInferX<T> = T[][T extends any ? 0 : never]

/**
 * Wrap the storage with promise
 */
export default class StoragePromise {
    private storage: chrome.storage.StorageArea

    constructor(storage: chrome.storage.StorageArea) {
        this.storage = storage
    }

    get<T = { [key: string]: any }>(
        keys?: NoInferX<keyof T> | Array<NoInferX<keyof T>> | Partial<NoInferX<T>> | null,
    ): Promise<{ [key: string]: any }> {
        return new Promise(resolve => this.storage.get(keys, resolve))
    }

    /**
     * @since 0.5.0
     */
    async getOne<T>(key: string): Promise<T> {
        return (await this.get(key))[key] as T
    }

    set(obj: any): Promise<void> {
        return new Promise<void>(resolve => this.storage.set(obj, resolve))
    }

    /**
     * @since 0.5.0
     */
    put(key: string, val: Object): Promise<void> {
        return this.set({ [key]: val })
    }

    remove(key: string | string[]): Promise<void> {
        return new Promise(resolve => this.storage.remove(key, resolve))
    }

    async getUsedMemory(): Promise<number> {
        if (this.storage.getBytesInUse) {
            return new Promise(resolve => this.storage.getBytesInUse(resolve))
        } else {
            const store = await this.get()
            return JSON.stringify(store).length
        }
    }
}