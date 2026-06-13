import calendarMessages, { type CalendarMessage } from '../common/calendar'
import metaMessages, { type MetaMessage } from '../common/meta'
import sharedMessages, { type SharedMessage } from '../common/shared'
import { merge, MessageRoot } from '../merge'
import notificationMessages, { type NotificationMessage } from './notification'

export type BgMessage = {
    shared: SharedMessage
    meta: MetaMessage
    calendar: CalendarMessage
    notification: NotificationMessage
}

const CHILD_MESSAGES: MessageRoot<BgMessage> = {
    shared: sharedMessages,
    meta: metaMessages,
    calendar: calendarMessages,
    notification: notificationMessages,
}

export default merge(CHILD_MESSAGES)