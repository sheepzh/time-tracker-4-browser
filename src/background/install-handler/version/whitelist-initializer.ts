import whitelistHolder from '../../service/whitelist/holder'
import type { Migrator } from "./types"

export default class WhitelistInitializer implements Migrator {
    onInstall(): void {
        whitelistHolder.add('localhost:*/**')
    }

    onUpdate(_version: string): void {
    }
}