import resources from "./notification-resource.json"

export type NotificationMessage = {
    dailySummary: string
}

export default resources satisfies Messages<NotificationMessage>