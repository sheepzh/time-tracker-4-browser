/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import whitelistDatabase from "@db/whitelist-database"
import WhitelistProcessor from './processor'

/**
 * The singleton implementation of whitelist holder
 */
class WhitelistHolder {
    private processor = new WhitelistProcessor()
    private postHandlers: NoArgCallback[]

    constructor() {
        whitelistDatabase.selectAll().then(list => this.processor.setWhitelist(list))
        whitelistDatabase.addChangeListener(whitelist => {
            this.processor.setWhitelist(whitelist)
            this.postHandlers.forEach(handler => handler())
        })
        this.postHandlers = []
    }

    addPostHandler(handler: () => void) {
        this.postHandlers.push(handler)
    }

    contains(host: string, url: string): boolean {
        return this.processor.contains(host, url)
    }
}

export default new WhitelistHolder()