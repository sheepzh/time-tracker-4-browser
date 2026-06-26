import resource from "./notification-resource.json"

export type NotificationMessage = {
    focus: {
        completedTitle: string
        completedMsg: string
        breakStartMsg: string
        focusResumeMsg: string
    }
    dailySummary: string
}

const _default: Messages<NotificationMessage> = resource

export default _default