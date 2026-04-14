import { getVersion } from "@api/chrome/runtime"
import db from "@db/stat-database"
import { cvtOption2Locale } from "@i18n"
import { cvtDateRange2Str, formatTimeYMD, MILL_PER_DAY, MILL_PER_WEEK } from "@util/time"
import optionHolder from "../components/option-holder"
import BrowserNotifier from "./browser/notifier"
import CallbackNotifier from "./callback/notifier"
import type { NotificationData, NotificationRequest, Notifier } from "./types"

const DATE_RANGE_CALCULATORS: Record<NotificationRequest['cycle'], (now: number) => Date | [Date, Date]> = {
    daily: now => new Date(now - MILL_PER_DAY),
    weekly: now => [new Date(now - MILL_PER_WEEK), new Date(now - MILL_PER_DAY)],
}

class Processor {
    private notifiers: {
        [method in timer.notification.Method]: Notifier
    }

    constructor() {
        this.notifiers = {
            browser: new BrowserNotifier(),
            callback: new CallbackNotifier(),
        }
    }

    async doSend(): Promise<string | undefined> {
        const option = await optionHolder.get()
        const {
            notificationCycle: cycle, notificationMethod: method,
            notificationEndpoint: endpoint, notificationAuthToken: authToken,
        } = option
        if (cycle === 'none') return undefined

        const notifier = this.notifiers[method]
        const req: NotificationRequest = { cycle, method, endpoint, authToken }
        const data = await this.buildData(req)

        try {
            return await notifier.send(req, data)
        } catch (e) {
            console.error("Error to send notification", e)
            return e instanceof Error ? e.message : String(e)
        }
    }

    private async buildData(req: NotificationRequest): Promise<NotificationData> {
        const now = Date.now()
        const date = DATE_RANGE_CALCULATORS[req.cycle](now)

        // Query rows
        const rows = await db.select({ date: cvtDateRange2Str(date) })

        // Calculate summary
        let totalFocus = 0
        let totalVisit = 0
        const uniqueHosts = new Set<string>()

        rows.forEach(row => {
            totalFocus += row.focus
            totalVisit += row.time
            uniqueHosts.add(row.host)
        })

        const option = await optionHolder.get()
        const locale = cvtOption2Locale(option.locale)

        const [dateStart, dateEnd] = Array.isArray(date) ? date : [date, date]

        return {
            cycle: req.cycle,
            meta: {
                locale,
                version: getVersion(),
                ts: Date.now(),
            },
            summary: {
                focus: totalFocus,
                visit: totalVisit,
                siteCount: uniqueHosts.size,
                dateStart: formatTimeYMD(dateStart),
                dateEnd: formatTimeYMD(dateEnd),
            },
            row: rows,
        }
    }
}

export default new Processor()
