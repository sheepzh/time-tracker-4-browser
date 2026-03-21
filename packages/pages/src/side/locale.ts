/**
 * Copyright (c) 2024-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey as _I18nKey, t as _t } from "@i18n"
import messages, { type SideMessage } from "@i18n/message/side"

export type I18nKey = _I18nKey<SideMessage>

export const t = (key: I18nKey, param?: any) => {
    const props = { key, param }
    return _t<SideMessage>(messages, props)
}
