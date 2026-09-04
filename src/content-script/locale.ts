/**
 * Copyright (c) 2022 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { t as t_, type I18nKey as I18nKey_ } from "@i18n"
import messages, { type CsMessage } from "@i18n/message/cs"

export type I18nKey = I18nKey_<CsMessage>

export function t(key: I18nKey, param?: any): string {
    return t_(messages, { key, param })
}