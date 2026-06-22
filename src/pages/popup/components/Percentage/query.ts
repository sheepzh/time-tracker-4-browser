import { listAllGroups } from "@api/chrome/tabGroups"
import { queryRows, } from "@popup/components/stat/common"
import { t } from '@popup/locale'
import { getBirthday, getDayLength } from "@util/time"
import type { StatOption, StatQuery } from '../stat/context'

export type PercentageResult = {
    query: StatQuery
    rows: tt4b.stat.Row[]
    // Actually date range according to duration
    date: Date | [Date, Date?] | undefined
    displaySiteName: boolean
    dataDate: [string, string] | undefined
    chartTitle: string
    itemCount: number
    dateLength: number
    groups: chrome.tabGroups.TabGroup[]
    donutChart: boolean
    cateNameMap: Record<number, string>
}

const findAllDates = (row: tt4b.stat.Row): string[] => {
    const set = new Set<string>()
    const { date, mergedDates } = row
    date && set.add(date)
    mergedDates?.forEach(d => set.add(d))
    'mergedRows' in row && row.mergedRows?.flatMap(findAllDates).forEach(d => set.add(d))
    return Array.from(set)
}

const findDateRange = (dates: Set<string>): [string, string] | undefined => {
    let minDate: string | undefined = undefined
    let maxDate: string | undefined = undefined
    dates.forEach(d => {
        if (!minDate || d < minDate) minDate = d
        if (!maxDate || d > maxDate) maxDate = d
    })
    return minDate && maxDate ? [minDate, maxDate] : undefined
}

export const doQuery = async (query: StatQuery, option: StatOption, cateNameMap: Record<number, string>): Promise<PercentageResult> => {
    const { topN: itemCount, showName: displaySiteName, donutChart } = option
    const [rows, date] = await queryRows(query)
    const groups = await listAllGroups()

    // Count actual unique days with data
    const allDates = new Set<string>()
    rows.flatMap(findAllDates).forEach(d => allDates.add(d))
    const dateLength = allDates.size > 0 ? allDates.size
        : (Array.isArray(date) ? getDayLength(date[0] ?? getBirthday(), date[1] ?? new Date()) : 1)

    const dataDate = findDateRange(allDates)

    return {
        query, rows,
        date, dataDate,
        dateLength,
        displaySiteName,
        chartTitle: t(msg => msg.content.percentage.title[query?.duration], { n: query?.durationNum }),
        itemCount,
        groups,
        donutChart,
        cateNameMap,
    } satisfies PercentageResult
}
