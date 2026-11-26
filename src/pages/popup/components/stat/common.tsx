import StatDay, { statRangeStr, type StatRange } from '@/shared/day'
import { listCateStats, listGroupStats, listSiteStats } from '@api/sw/stat'
import { RECORD_ROUTE, type RecordQuery } from "@app/router/constants"
import { isRemainHost } from "@util/constant/remain-host"
import { getAppPageUrl } from "@util/constant/url"
import { isSite } from "@util/stat"
import type { StatQuery } from './context'

type DateRangeCalculator = (today: StatDay, weekStart: tt4b.WeekStart, num?: number) => StatRange | undefined

const DATE_RANGE_CALCULATORS: Record<tt4b.ui.PopupDuration, DateRangeCalculator> = {
    today: today => today.rangeTo(0),
    yesterday: today => today.prev().rangeTo(0),
    thisWeek: (today, weekStart) => today.weekStart(weekStart).rangeTo(today),
    thisMonth: today => today.monthStart().rangeTo(today),
    lastDays: (today, _, num) => today.rangeTo(-(num ?? 0)),
    allTime: () => undefined,
}

type RowsResult = [rows: tt4b.stat.Row[], date: StatRange | undefined]
type RowsQuery = StatQuery & {
    weekStart: tt4b.WeekStart
    dayStart: number
}
export const queryRows = async (query: RowsQuery): Promise<RowsResult> => {
    const { duration, mergeMethod, dimension: sortKey, weekStart, dayStart } = query
    const today = StatDay.today(dayStart)
    const dateRange = typeof duration === 'string'
        ? DATE_RANGE_CALCULATORS[duration](today, weekStart)
        : DATE_RANGE_CALCULATORS[duration.type](today, weekStart, duration.value)
    const date = statRangeStr(dateRange)
    const sortDirection: tt4b.common.SortDirection = 'DESC'
    let rows: tt4b.stat.Row[]
    if (mergeMethod === 'cate') {
        rows = await listCateStats({ date, mergeDate: true, sortKey, sortDirection, remote: false })
    } else if (mergeMethod === 'group') {
        rows = await listGroupStats({ date, mergeDate: true, sortKey, sortDirection })
    } else {
        rows = await listSiteStats({
            date, mergeDate: true,
            mergeHost: mergeMethod === 'domain',
            sortKey, sortDirection,
            remote: false,
        })
    }
    return [rows, dateRange]
}

function buildRecordQuery(siteType: tt4b.site.Type, date: StatRange | undefined, type: tt4b.core.Dimension): RecordQuery {
    const query: RecordQuery = {}
    // Merge host
    siteType === 'merged' && (query.mm = 'domain')
    // Date
    query.md = '1'
    if (date) {
        query.ds = date[0].toString()
        query.de = date[1].toString()
    }
    // Sorted column
    query.sc = type
    return query
}

export function calJumpUrl(
    row: tt4b.stat.Row | undefined,
    date: StatRange | undefined,
    type: tt4b.core.Dimension,
): string | undefined {
    if (!row) return
    if (isSite(row)) {
        const { siteKey: { host, type: siteType } } = row

        if (siteType === 'normal' && !isRemainHost(host)) {
            return `http://${host}`
        }

        const query = buildRecordQuery(siteType, date, type)
        query.q = host
        return getAppPageUrl(RECORD_ROUTE, query)
    }
}