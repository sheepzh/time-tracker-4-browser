type Summary = {
    focus: number
    visit: number
    siteCount: number
    dateStart: string
    dateEnd: string
}

export type NotificationMeta = {
    locale: tt4b.Locale
    version: string
    ts: number
}

export type NotificationRequest = {
    cycle: Exclude<tt4b.notification.Cycle, 'none'>
    method: tt4b.notification.Method
    endpoint?: tt4b.option.NotificationOption['notificationEndpoint']
    authToken?: tt4b.option.NotificationOption['notificationAuthToken']
}

/**
 * Notification data to be sent
 */
export type NotificationData = {
    meta: NotificationMeta
    cycle: Exclude<tt4b.notification.Cycle, 'none'>
    summary: Summary
    row: tt4b.core.Row[]
}

/**
 * Notifier interface for different notification methods
 */
export interface Notifier {
    /**
     * Send notification
     */
    send(req: NotificationRequest, data: NotificationData): Promise<string | undefined>
}