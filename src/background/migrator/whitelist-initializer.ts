import whitelistService from "@service/whitelist/service"
import type { Migrator } from "./types"

export default class WhitelistInitializer implements Migrator {
    onInstall(): void {
        whitelistService.add('localhost:*/**')
    }

    onUpdate(_version: string): void {
    }
}