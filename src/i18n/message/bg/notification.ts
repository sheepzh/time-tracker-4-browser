import resource from "./notification-resource.json"

export type NotificationMessage = {
    dailySummary: string
}

const _default: Messages<NotificationMessage> = resource

export default _default