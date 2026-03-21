/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t as t_, type I18nKey } from "@i18n"
import messages, { type CsMessage } from "@i18n/message/cs"

export function t(key: I18nKey<CsMessage>, param?: any): string {
    return t_(messages, { key, param })
}