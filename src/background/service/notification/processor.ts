import { getVersion } from "@api/chrome/runtime"
import { cvtOption2Locale } from "@i18n"
import optionHolder from "@/background/service/components/option-holder"
import itemService from "@/background/service/item-service"
import { formatTimeYMD, MILL_PER_DAY, MILL_PER_WEEK } from "@util/time"
import BrowserNotifier from "./browser/notifier"
import CallbackNotifier from "./callback/notifier"
import type { NotificationData, NotificationRequest, Notifier } from "./types"

type Result<T> = {
    success: true
    data: T
} | {
    success: false
    errorMsg: string
}

function error<T>(msg: string): Result<T> {
    return { success: false, errorMsg: msg }
}

function success<T>(data: T): Result<T> {
    return { success: true, data }
}

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

    async doSend(): Promise<Result<void>> {
        const option = await optionHolder.get()
        const {
            notificationCycle: cycle, notificationMethod: method,
            notificationEndpoint: endpoint, notificationAuthToken: authToken,
        } = option
        if (cycle === 'none') return success(undefined)

        const notifier = this.notifiers[method]
        const req: NotificationRequest = { cycle, method, endpoint, authToken }
        const data = await this.buildData(req)

        try {
            const errMsg = await notifier.send(req, data)
            return errMsg ? error(errMsg) : success(undefined)
        } catch (e) {
            console.error("Error to send notification", e)
            const msg = e instanceof Error ? e.message : String(e)
            return error(msg)
        }
    }

    private async buildData(req: NotificationRequest): Promise<NotificationData> {
        const now = Date.now()
        const date = DATE_RANGE_CALCULATORS[req.cycle](now)

        // Query rows
        const rows = await itemService.selectItems({ date })

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
