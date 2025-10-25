import type { ReportQueryParam } from "@app/components/Report/types"
import { REPORT_ROUTE } from "@app/router/constants"
import weekHelper from "@service/components/week-helper"
import { selectCate, selectGroup, selectSite } from '@service/stat-service'
import { isRemainHost } from "@util/constant/remain-host"
import { getAppPageUrl } from "@util/constant/url"
import { isSite } from "@util/stat"
import { getMonthTime, MILL_PER_DAY } from "@util/time"
import { type PopupDuration, type PopupQuery } from "./context"

type DateRange = Date | [Date, Date] | undefined

type DateRangeCalculator = (now: Date, num?: number) => Awaitable<DateRange>

const DATE_RANGE_CALCULATORS: { [duration in PopupDuration]: DateRangeCalculator } = {
    today: now => now,
    yesterday: now => new Date(now.getTime() - MILL_PER_DAY),
    thisWeek: async now => {
        const [start] = await weekHelper.getWeekDate(now)
        return [start, now]
    },
    thisMonth: now => [getMonthTime(now)[0], now],
    lastDays: (now, num) => [new Date(now.getTime() - MILL_PER_DAY * (num ?? 1 - 1)), now],
    allTime: () => undefined,
}

export const queryRows = async (param: PopupQuery): Promise<[rows: timer.stat.Row[], date: DateRange]> => {
    const { duration, durationNum, mergeMethod, dimension: sortKey } = param
    const date = await DATE_RANGE_CALCULATORS[duration]?.(new Date(), durationNum)
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
    return [rows, date]
}

function buildReportQuery(siteType: timer.site.Type, date: Date | [Date, Date?] | undefined, type: timer.core.Dimension): ReportQueryParam {
    const query: ReportQueryParam = {}
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

export function calJumpUrl(row: timer.stat.Row | undefined, date: Date | [Date, Date?] | undefined, type: timer.core.Dimension): string | undefined {
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
