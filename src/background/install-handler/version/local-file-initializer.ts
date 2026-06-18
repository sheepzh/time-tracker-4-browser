/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t } from '@bg/i18n'
import mergeRuleDatabase from "@db/merge-rule-database"
import { saveSite } from '@service/site-service'
import { JSON_HOST, LOCAL_HOST_PATTERN, MERGED_HOST, PDF_HOST, PIC_HOST, TXT_HOST } from "@util/constant/remain-host"
import { type Migrator } from "./types"

/**
 * Process the host of local files
 *
 * @since 0.7.0
 */
export default class LocalFileInitializer implements Migrator {
    onUpdate(_version: string): void {
    }

    onInstall(): void {
        // Add merged rules
        mergeRuleDatabase.add({
            origin: LOCAL_HOST_PATTERN,
            merged: MERGED_HOST,
        }).then(() => console.log('Local file merge rules initialized'))
        // Add site name
        const hostAlias = {
            [PDF_HOST]: t(msg => msg.initial.localFile.pdf),
            [JSON_HOST]: t(msg => msg.initial.localFile.json),
            [PIC_HOST]: t(msg => msg.initial.localFile.pic),
            [TXT_HOST]: t(msg => msg.initial.localFile.txt),
        }
        for (const [host, alias] of Object.entries(hostAlias)) {
            void saveSite({ host, type: 'normal', alias, iconUrl: undefined }, true)
        }
    }
}