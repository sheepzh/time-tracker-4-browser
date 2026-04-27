/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import baseMessages, { type BaseMessage } from "../common/base"
import calendarMessages, { type CalendarMessage } from "../common/calendar"
import sharedMessages, { type SharedMessage } from "../common/shared"
import itemMessages, { type ItemMessage } from "../item"
import { merge, type MessageRoot } from "../merge"
import metaMessages, { type MetaMessage } from "../meta"
import contentMessages, { type ContentMessage } from "./content"
import footerMessages, { type FooterMessage } from "./footer"
import headerMessages, { type HeaderMessage } from "./header"
import limitMessages, { type LimitMessage } from './limit'

export type PopupMessage = {
    content: ContentMessage
    limit: LimitMessage
    item: ItemMessage
    meta: MetaMessage
    base: BaseMessage
    header: HeaderMessage
    footer: FooterMessage
    calendar: CalendarMessage
    shared: SharedMessage
}

const MESSAGE_ROOT: MessageRoot<PopupMessage> = {
    content: contentMessages,
    limit: limitMessages,
    item: itemMessages,
    meta: metaMessages,
    base: baseMessages,
    header: headerMessages,
    footer: footerMessages,
    calendar: calendarMessages,
    shared: sharedMessages,
}

const _default = merge<PopupMessage>(MESSAGE_ROOT)

export default _default