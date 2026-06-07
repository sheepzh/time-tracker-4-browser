import resources from "./notification-resource.json"

export type NotificationMessage = {
    focus: {
        completedTitle: string
        completedMsg: string
        breakStartMsg: string
        focusResumeMsg: string
    }
    dailySummary: string
}

export default resources satisfies Messages<NotificationMessage>