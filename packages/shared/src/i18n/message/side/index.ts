import calendarMessages, { type CalendarMessage } from "../common/calendar"
import { merge, type MessageRoot } from "../merge"
import listMessages, { type ListMessage } from "./list"

export type SideMessage = {
    list: ListMessage
    calendar: CalendarMessage
}

const MESSAGE_ROOT: MessageRoot<SideMessage> = {
    list: listMessages,
    calendar: calendarMessages,
}

const _default = merge<SideMessage>(MESSAGE_ROOT)

export default _default