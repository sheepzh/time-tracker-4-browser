import calendarMessages, { type CalendarMessage } from '../common/calendar'
import initialMessages, { type InitialMessage } from '../common/initial'
import metaMessages, { type MetaMessage } from '../common/meta'
import { merge, MessageRoot } from '../merge'
import notificationMessages, { type NotificationMessage } from './notification'

export type BgMessage = {
    meta: MetaMessage
    calendar: CalendarMessage
    notification: NotificationMessage
    initial: InitialMessage
}

const CHILD_MESSAGES: MessageRoot<BgMessage> = {
    meta: metaMessages,
    calendar: calendarMessages,
    notification: notificationMessages,
    initial: initialMessages,
}

export default merge(CHILD_MESSAGES)