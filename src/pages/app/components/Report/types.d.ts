import type { Sort } from "element-plus"

export type ReportSort = Omit<Sort, 'prop'> & {
    prop: timer.core.Dimension | 'host' | 'date'
}

/**
* The query param of report page
*/
export type ReportQueryParam = {
    /**
     * Query
     */
    q?: string
    /**
     * Merge method
     */
    mm?: Exclude<timer.stat.MergeMethod, 'date'>
    /**
     * Merge date
     */
    md?: string
    /**
     * Date start
     */
    ds?: string
    /**
     * Date end
     */
    de?: string
    /**
     * Sorted column
     */
    sc?: timer.core.Dimension
}

export type ReportFilterOption = {
    query: string | undefined
    dateRange: [Date?, Date?]
    mergeDate: boolean
    siteMerge?: timer.stat.MergeMethod & ('cate' | 'domain' | 'group')
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