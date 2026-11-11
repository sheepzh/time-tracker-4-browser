/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { t as _t, tN as _tN, locale, type I18nKey as _I18nKey } from "@i18n"
import messages, { type PopupMessage } from "@i18n/message/popup"

export type I18nKey = _I18nKey<PopupMessage>
export { locale }

export const t = (key: I18nKey, param?: any) => _t<PopupMessage>(messages, { key, param })

export const tN = (key: I18nKey, param?: any) => _tN<PopupMessage>(messages, { key, param })

export {
    ALL_LOCALES, dateFmt, handleLocaleOption, initLocale, localeSameAsBrowser, ptFmt, tDateRangeSeparator
} from "@i18n"

