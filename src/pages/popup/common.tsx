import { getWeekBounds } from "@api/sw/option"
import { selectCate, selectGroup, selectSite } from '@api/sw/stat'
import { REPORT_ROUTE, type ReportQuery } from "@app/router/constants"
import type { PopupDuration, PopupQuery } from "@popup/types"
import { isRemainHost } from "@util/constant/remain-host"
import { getAppPageUrl } from "@util/constant/url"
import { isSite } from "@util/stat"
import { cvtDateRange2Str, getMonthTime, MILL_PER_DAY, type DateRange } from "@util/time"

type DateRangeCalculator = (now: Date, num?: number) => Awaitable<[Date, Date] | Date | undefined>

const DATE_RANGE_CALCULATORS: { [duration in PopupDuration]: DateRangeCalculator } = {
    today: now => now,
    yesterday: now => new Date(now.getTime() - MILL_PER_DAY),
    thisWeek: async now => {
        const [start] = await getWeekBounds(now)
        return [start, now]
    },
    thisMonth: now => [getMonthTime(now)[0], now],
    lastDays: (now, num) => [new Date(now.getTime() - MILL_PER_DAY * (num ?? 1 - 1)), now],
    allTime: () => undefined,
}

export const queryRows = async (param: PopupQuery): Promise<[rows: timer.stat.Row[], date: [Date, Date] | Date | undefined]> => {
    const { duration, durationNum, mergeMethod, dimension: sortKey } = param
    const dateRange = await DATE_RANGE_CALCULATORS[duration]?.(new Date(), durationNum)
    const date = cvtDateRange2Str(dateRange)
    const sortDirection: timer.common.SortDirection = 'DESC'
    let rows: timer.stat.Row[]
    if (mergeMethod === 'cate') {
        rows = await selectCate({ date, mergeDate: true, sortKey, sortDirection })
    } else if (mergeMethod === 'group') {
        rows = await selectGroup({ date, mergeDate: true, sortKey, sortDirection })
    } else {
        rows = await selectSite({
            date, mergeDate: true,
            mergeHost: mergeMethod === 'domain',
            sortKey, sortDirection,
        })
    }
    return [rows, dateRange]
}

function buildReportQuery(siteType: timer.site.Type, date: DateRange | undefined, type: timer.core.Dimension): ReportQuery {
    const query: ReportQuery = {}
    // Merge host
    siteType === 'merged' && (query.mm = 'domain')
    // Date
    query.md = '1'
    if (Array.isArray(date)) {
        if (date.length === 1) {
            query.ds = query.de = date[0]?.getTime?.()?.toString?.()
        } else if (date.length === 2) {
            query.ds = date[0]?.getTime?.()?.toString?.()
            // End is now
            // Not the end of this week/month
            query.de = new Date().getTime().toString()
        }
    } else if (!!date) {
        query.ds = query.de = date.getTime?.()?.toString?.()
    }
    // Sorted column
    query.sc = type
    return query
}

export function calJumpUrl(
    row: timer.stat.Row | undefined,
    date: DateRange | undefined,
    type: timer.core.Dimension,
): string | undefined {
    if (!row) return
    if (isSite(row)) {
        const { siteKey: { host, type: siteType } } = row

        if (siteType === 'normal' && !isRemainHost(host)) {
            return `http://${host}`
        }

        const query = buildReportQuery(siteType, date, type)
        query.q = host
        return getAppPageUrl(REPORT_ROUTE, query)
    }
}
