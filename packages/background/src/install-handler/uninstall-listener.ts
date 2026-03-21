/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { setUninstallURL } from "@api/chrome/runtime"
import { locale } from "@i18n"
import { UNINSTALL_QUESTIONNAIRE } from "@util/constant/url"

async function listen() {
    try {
        const uninstallUrl = UNINSTALL_QUESTIONNAIRE[locale] || UNINSTALL_QUESTIONNAIRE['en']
        uninstallUrl && setUninstallURL(uninstallUrl)
    } catch (e) {
        console.error(e)
    }
}

/**
 * @since 0.9.6
 */
export default class UninstallListener {
    listen = listen
}
