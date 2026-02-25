/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getVersion, onInstalled } from "@api/chrome/runtime"
import CateInitializer from "./cate-initializer"
import HostMergeInitializer from "./host-merge-initializer"
import IndexedDBMigrator from './indexed-migrator'
import LocalFileInitializer from "./local-file-initializer"
import type { Migrator } from "./types"
import WhitelistInitializer from "./whitelist-initializer"

/**
 * Version manager
 *
 * @since 0.1.2
 */
class VersionManager {
    processorChain: Migrator[] = []

    constructor() {
        this.processorChain.push(
            new HostMergeInitializer(),
            new LocalFileInitializer(),
            new WhitelistInitializer(),
            new CateInitializer(),
            new IndexedDBMigrator(),
        )
    }

    private onChromeInstalled(reason: ChromeOnInstalledReason) {
        const version: string = getVersion()
        if (reason === 'update') {
            // Update, process the latest version, which equals to current version
            this.processorChain.forEach(processor => processor.onUpdate(version))
        } else if (reason === 'install') {
            // All
            this.processorChain.forEach(processor => processor.onInstall())
        }
    }

    init() {
        onInstalled(reason => this.onChromeInstalled(reason))
    }
}

export default VersionManager