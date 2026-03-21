/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type I18nKey as _I18nKey, t as _t, tN as _tN } from "@i18n"
import messages, { type PopupMessage } from "@i18n/message/popup"
import type { VNode } from 'vue'

export type I18nKey = _I18nKey<PopupMessage>

export const t = (key: I18nKey, param?: any) => _t<PopupMessage>(messages, { key, param })

export const tN = (key: I18nKey, param?: any) => _tN<PopupMessage, VNode>(messages, { key, param })