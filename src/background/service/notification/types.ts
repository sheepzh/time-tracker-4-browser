export type Count = {
    total: number
    average: number
}

export type Summary = {
    focus: number
    visit: number
    siteCount: number
    dateStart: string
    dateEnd: string
}

export type NotificationMeta = {
    locale: timer.Locale
    version: string
    ts: number
}

export type NotificationRequest = {
    cycle: Exclude<timer.notification.Cycle, 'none'>
    method: timer.notification.Method
    endpoint?: timer.option.NotificationOption['notificationEndpoint']
    authToken?: timer.option.NotificationOption['notificationAuthToken']
}

/**
 * Notification data to be sent
 */
export type NotificationData = {
    meta: NotificationMeta
    cycle: Exclude<timer.notification.Cycle, 'none'>
    summary: Summary
    row: timer.core.Row[]
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