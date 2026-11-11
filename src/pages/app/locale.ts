/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t as _t, tN as _tN, locale, type I18nKey as _I18nKey, type TnParam, type TParam } from "@i18n"
import messages, { type AppMessage } from "@i18n/message/app"

export type I18nKey = _I18nKey<AppMessage>
export { locale }

export const t = (key: I18nKey, param?: TParam) => _t<AppMessage>(messages, { key, param })

/**
 * @since 0.8.8
 */
export function tWith(key: I18nKey, specLocale: tt4b.Locale, param?: TParam) {
    return _t<AppMessage>(messages, { key, param }, specLocale)
}

export const tN = (key: I18nKey, param?: TnParam) => _tN<AppMessage>(messages, { key, param })

export {
    ALL_LOCALES, dateFmt, dateTimeFmt, initLocale, isTranslatingLocale, localeSameAsBrowser, ptFmt,
    tDateRangeSeparator, tNum, tWeekDays, tYMD, unitFmt
} from "@i18n"

