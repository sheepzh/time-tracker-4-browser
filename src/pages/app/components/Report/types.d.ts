import { DateRange } from '@util/time'
import type { Sort } from "element-plus"

export type ReportSort = Omit<Sort, 'prop'> & {
    prop: tt4b.core.Dimension | 'host' | 'date'
}

export type ReportFilterOption = {
    query: string | undefined
    dateRange: DateRange
    mergeDate: boolean
    siteMerge?: Exclude<tt4b.stat.MergeMethod, 'date'>
    cateIds?: number[]
    /**
     * @since 1.1.7
     */
    timeFormat: tt4b.app.TimeFormat
    readRemote?: boolean
}

export interface DisplayComponent {
    getSelected(): tt4b.stat.Row[]
    refresh(): Promise<void> | void
}