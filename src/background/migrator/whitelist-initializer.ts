import whitelistService from "@service/whitelist/service"
import { type Migrator } from "./common"

export default class WhitelistInitializer implements Migrator {
    onInstall(): void {
        whitelistService.add('localhost:*/**')
    }

    onUpdate(version: string): void {
        version === '2.5.7' && this.onInstall()
    }
}