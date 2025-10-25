import { queryRows } from "@popup/common"
import type { PopupOption, PopupQuery } from "@popup/context"
import { sum } from "@util/array"

export type RankingResult = {
    rows: timer.stat.Row[]
    max: number
    total: number
    displaySiteName: boolean
    date: Date | [Date, Date?] | undefined
}

export const doQuery = async (query: PopupQuery, option: PopupOption): Promise<RankingResult> => {
    const [rows, date] = await queryRows(query)
    const { dimension } = query
    const values = rows?.map(r => r?.[dimension] ?? 0) ?? []
    const max = values.sort((a, b) => (b ?? 0) - (a ?? 0))[0] ?? 0
    const total = sum(values)
    const { showName } = option
    return { max, total, rows, date, displaySiteName: showName }
}