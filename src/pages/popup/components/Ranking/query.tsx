import { queryRows } from "@popup/components/stat/common"
import { sum } from "@util/array"
import type { DateRange } from '@util/time'
import type { StatOption, StatQuery } from '../stat/context'

type RankingResult = {
    rows: tt4b.stat.Row[]
    max: number
    total: number
    displaySiteName: boolean
    date: DateRange
}

export const doQuery = async (query: StatQuery, option: StatOption): Promise<RankingResult> => {
    const [rows, date] = await queryRows(query)
    const { dimension } = query
    const values = rows.map(r => r[dimension])
    const max = values.reduce((m, v) => v > m ? v : m, 0)
    const total = sum(values)
    const { showName } = option
    return { max, total, rows, date, displaySiteName: showName }
}