/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import menuMessages, { type MenuMessage } from "../app/menu"
import baseMessages, { type BaseMessage } from "../common/base"
import calendarMessages, { type CalendarMessage } from "../common/calendar"
import sharedMessages, { type SharedMessage } from "../common/shared"
import itemMessages, { type ItemMessage } from "../item"
import { merge, type MessageRoot } from "../merge"
import metaMessages, { type MetaMessage } from "../meta"
import contentMessages, { type ContentMessage } from "./content"
import footerMessages, { type FooterMessage } from "./footer"
import headerMessages, { type HeaderMessage } from "./header"

export type PopupMessage = {
    content: ContentMessage
    item: ItemMessage
    meta: MetaMessage
    base: BaseMessage
    header: HeaderMessage
    footer: FooterMessage
    menu: MenuMessage
    calendar: CalendarMessage
    shared: SharedMessage
}

const MESSAGE_ROOT: MessageRoot<PopupMessage> = {
    content: contentMessages,
    item: itemMessages,
    meta: metaMessages,
    base: baseMessages,
    header: headerMessages,
    footer: footerMessages,
    menu: menuMessages,
    calendar: calendarMessages,
    shared: sharedMessages,
}

const _default = merge<PopupMessage>(MESSAGE_ROOT)

export default _default