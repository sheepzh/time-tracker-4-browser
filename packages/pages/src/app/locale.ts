/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nResultItem, type I18nKey as _I18nKey, t as _t, tN as _tN } from "@i18n"
import messages, { type AppMessage } from "@i18n/message/app"
import { type VNode } from "vue"

export type I18nKey = _I18nKey<AppMessage>

export function t(key: I18nKey, param?: any) {
    const props = { key, param }
    return _t<AppMessage>(messages, props)
}

/**
 * @since 0.8.8
 */
export function tWith(key: I18nKey, specLocale: timer.Locale, param?: any) {
    const props = { key, param }
    return _t<AppMessage>(messages, props, specLocale)
}

export function tN(key: I18nKey, param?: any): I18nResultItem<VNode>[] {
    return _tN<AppMessage, VNode>(messages, { key, param })
}