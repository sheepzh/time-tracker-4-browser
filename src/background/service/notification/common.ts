import type { NotificationData } from './types'

export function formatNotificationData(data: NotificationData): string {
    return JSON.stringify(data, null, 2)
}
