import { saveSite } from '@service/site-service'
import type { Migrator } from "./types"

export default class WhitelistInitializer implements Migrator {
    onInstall(): void {
        // Set whitelist for localhost
        void saveSite({
            host: 'localhost:*/**', type: 'virtual',
            alias: 'localhost with ports',
            options: { white: true },
        }, true)
    }

    onUpdate(_version: string): void {
    }
}