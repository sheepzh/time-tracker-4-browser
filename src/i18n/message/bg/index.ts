import baseMessages, { type BaseMessage } from '../common/base'
import calendarMessages, { type CalendarMessage } from '../common/calendar'
import contextMenusMessages, { type ContextMenusMessage } from '../common/context-menus'
import focusMessages, { type FocusMessage } from '../common/focus'
import initialMessages, { type InitialMessage } from '../common/initial'
import metaMessages, { type MetaMessage } from '../common/meta'
import sharedMessages, { type SharedMessage } from '../common/shared'
import { merge, MessageRoot } from '../merge'
import notificationMessages, { type NotificationMessage } from './notification'

export type BgMessage = {
    shared: SharedMessage
    meta: MetaMessage
    calendar: CalendarMessage
    notification: NotificationMessage
    initial: InitialMessage
    focus: FocusMessage
    base: BaseMessage
    contextMenus: ContextMenusMessage
}

const CHILD_MESSAGES: MessageRoot<BgMessage> = {
    shared: sharedMessages,
    meta: metaMessages,
    calendar: calendarMessages,
    notification: notificationMessages,
    initial: initialMessages,
    focus: focusMessages,
    base: baseMessages,
    contextMenus: contextMenusMessages,
}

export default merge(CHILD_MESSAGES)