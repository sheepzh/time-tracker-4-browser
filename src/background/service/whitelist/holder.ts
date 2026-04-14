/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import db from "@db/whitelist-database"
import WhitelistProcessor from './processor'

/**
 * The singleton implementation of whitelist holder
 */
class WhitelistHolder {
    private processor = new WhitelistProcessor()
    private postHandlers: ArgCallback<string[]>[] = []

    constructor() {
        this.rebuild()
    }

    private async rebuild() {
        const whitelist = await db.selectAll()
        this.processor.setWhitelist(whitelist)
        this.postHandlers.forEach(handler => handler(whitelist))
    }

    addPostHandler(handler: ArgCallback<string[]>) {
        this.postHandlers.push(handler)
    }

    async add(white: string): Promise<void> {
        await db.add(white)
        await this.rebuild()
    }

    all(): Promise<string[]> {
        return db.selectAll()
    }

    async remove(white: string): Promise<void> {
        await db.remove(white)
        await this.rebuild()
    }

    contains(host: string, url: string): boolean {
        return this.processor.contains(host, url)
    }

    containsHost(host: string): boolean {
        return this.processor.containsHost(host)
    }
}

const whitelistHolder = new WhitelistHolder()
export default whitelistHolder