import type { RenderRowData, Sort } from "element-plus"

export type RecordSort = Omit<Sort, 'prop'> & {
    prop: tt4b.core.Dimension | 'host' | 'date'
}

export type SiteMerge = Exclude<tt4b.stat.MergeMethod, 'date'>

export type RowData = RenderRowData<tt4b.stat.Row>

export type RecordFilterOption = {
    query?: string
    dateRange: [number?, number?]
    mergeDate: boolean
    siteMerge?: SiteMerge
    cateIds?: number[]
    /**
     * @since 1.1.7
     */
    timeFormat: tt4b.ui.TimeFormat
    readRemote?: boolean
    /**
     * @since 4.4.2
     */
    focusRange?: Tuple<number | undefined, 2>
    timeRange?: Tuple<number | undefined, 2>
}

export interface DisplayComponent {
    getSelected(): tt4b.stat.Row[]
    refresh(): Promise<void> | void
}