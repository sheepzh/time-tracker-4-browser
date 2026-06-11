import { createNotification } from "@api/chrome/notifications"
import { hasPerm, requestPerm } from "@api/chrome/permission"
import { t } from '@bg/i18n'
import { formatPeriodCommon } from '@util/time'
import type { NotificationData, NotificationRequest, Notifier } from '../types'

/**
 * Send notification with `chrome.notifications` API
 */
export default class BrowserNotifier implements Notifier {
    /**
     * Test if the permission granted, if not granted, then try to grant
     */
    private async assertPerm(): Promise<string | undefined> {
        const hasPermission = await hasPerm('notifications')
        if (hasPermission) {
            return undefined
        }

        const granted = await requestPerm('notifications')
        if (!granted) {
            return "Notification permission is required but was denied"
        }

        return undefined
    }

    /**
     * Send notification with summary
     *
     * @param option
     * @param data
     */
    async send(_: NotificationRequest, data: NotificationData): Promise<string | undefined> {
        const errMsg = await this.assertPerm()
        if (errMsg) return errMsg

        const { cycle, summary: { focus, visit, siteCount } } = data

        const appName = t(msg => msg.meta.name)
        const calendar = t(msg => msg.calendar.range[cycle === 'daily' ? 'yesterday' : 'lastWeek'])
        const title = `${appName} - ${calendar}`
        const focusStr = formatPeriodCommon(focus, true)
        const message = t(msg => msg.notification.dailySummary, { focus: focusStr, visit, siteCount })

        await createNotification('time', { type: 'basic', title, message })
    }
}
