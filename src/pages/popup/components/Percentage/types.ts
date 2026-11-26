import type { StatRange } from '@/shared/day'
import type { StatOption, StatQuery } from '../stat/context'

export type PercentageResult = {
    query: StatQuery
    option: StatOption
    rows: tt4b.stat.Row[]
    // Actually date range according to duration
    date?: StatRange
    dataDate?: StatRange
    dateLength: number
    groups: chrome.tabGroups.TabGroup[]
    cateNameMap: Record<number, string>
}