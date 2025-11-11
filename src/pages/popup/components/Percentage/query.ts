import { listAllGroups } from "@api/chrome/tabGroups"
import { queryRows, } from "@popup/common"
import type { PopupOption, PopupQuery } from "@popup/context"
import { t } from "@popup/locale"
import { getDayLength } from "@util/time"

export type PercentageResult = {
    query: PopupQuery
    rows: timer.stat.Row[]
    // Actually date range according to duration
    date: Date | [Date, Date?] | undefined
    displaySiteName: boolean
    dataDate: [string, string] | undefined
    chartTitle: string
    itemCount: number
    dateLength: number
    groups: chrome.tabGroups.TabGroup[]
}

const findAllDates = (row: timer.stat.Row): Set<string> => {
    const set = new Set<string>()
    const { date, mergedDates } = row
    date && set.add(date)
    mergedDates?.forEach(d => set.add(d))
    'mergedRows' in row && row.mergedRows?.forEach(r => {
        const child = findAllDates(r)
        child.forEach(dd => set.add(dd))
    })
    return set
}

const findDateRange = (rows: timer.stat.Row[]): [string, string] | undefined => {
    const set = new Set<string>()
    rows?.forEach(row => {
        const dates = findAllDates(row)
        dates.forEach(d => set.add(d))
    })
    let minDate: string | undefined = undefined
    let maxDate: string | undefined = undefined
    set.forEach(d => {
        if (!minDate || d < minDate) minDate = d
        if (!maxDate || d > maxDate) maxDate = d
    })
    return minDate && maxDate ? [minDate, maxDate] : undefined
}

export const doQuery = async (query: PopupQuery, option: PopupOption): Promise<PercentageResult> => {
    const { topN: itemCount, showName: displaySiteName } = option
    const [rows, date] = await queryRows(query)
    const groups = await listAllGroups()

    const dataDate = findDateRange(rows)

    // Count actual unique days with data
    const allDatesSet = new Set<string>()
    rows?.forEach(row => {
        const dates = findAllDates(row)
        dates.forEach(d => allDatesSet.add(d))
    })
    const dateLength = allDatesSet.size > 0 ? allDatesSet.size : (date instanceof Array ? getDayLength(date[0], date[1] ?? new Date()) : 1)

    return {
        query, rows,
        date, dataDate,
        dateLength,
        displaySiteName,
        chartTitle: t(msg => msg.content.percentage.title[query?.duration], { n: query?.durationNum }),
        itemCount,
        groups,
    } satisfies PercentageResult
}
