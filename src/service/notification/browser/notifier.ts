import { createNotification } from "@api/chrome/notifications"
import { hasPerm, requestPerm } from "@api/chrome/permission"
import { getIconUrl } from "@api/chrome/runtime"
import { t } from '@i18n'
import calendarMessages from "@i18n/message/common/calendar"
import metaMessages from "@i18n/message/common/meta"
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

        const {
            cycle,
            meta: { locale },
            summary: { focus, visit, siteCount },
        } = data

        const appName = t(metaMessages, { key: msg => msg.name }, locale)
        const calendar = t(calendarMessages, { key: cycle === 'daily' ? msg => msg.range.yesterday : msg => msg.range.lastWeek }, locale)
        const title = `${appName} - ${calendar}`
        const focusStr = formatPeriodCommon(focus, true)

        const message = `Focus time: ${focusStr}, Visits: ${visit}, Sites: ${siteCount}`

        await createNotification('time', {
            type: 'basic',
            iconUrl: getIconUrl(),
            title,
            message,
        })
    }
}
