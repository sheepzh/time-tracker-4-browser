import { DateRange } from '@util/time'
import type { Sort } from "element-plus"

export type ReportSort = Omit<Sort, 'prop'> & {
    prop: timer.core.Dimension | 'host' | 'date'
}

export type ReportFilterOption = {
    query: string | undefined
    dateRange: DateRange
    mergeDate: boolean
    siteMerge?: Exclude<timer.stat.MergeMethod, 'date'>
    cateIds?: number[]
    /**
     * @since 1.1.7
     */
    timeFormat: timer.app.TimeFormat
    readRemote?: boolean
}

export interface DisplayComponent {
    getSelected(): timer.stat.Row[]
    refresh(): Promise<void> | void
}