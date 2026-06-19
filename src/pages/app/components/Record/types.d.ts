import type { Sort } from "element-plus"

export type RecordSort = Omit<Sort, 'prop'> & {
    prop: tt4b.core.Dimension | 'host' | 'date'
}

export type RecordFilterOption = {
    query?: string
    dateRange: [number?, number?]
    mergeDate: boolean
    siteMerge?: Exclude<tt4b.stat.MergeMethod, 'date'>
    cateIds?: number[]
    /**
     * @since 1.1.7
     */
    timeFormat: tt4b.ui.TimeFormat
    readRemote?: boolean
}

export interface DisplayComponent {
    getSelected(): tt4b.stat.Row[]
    refresh(): Promise<void> | void
}