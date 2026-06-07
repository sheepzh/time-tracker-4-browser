export type StatDuration =
    | "today" | "yesterday" | "thisWeek" | "thisMonth"
    | "lastDays"
    | "allTime"

export type StatQuery = {
    mergeMethod: Exclude<tt4b.stat.MergeMethod, 'date'> | undefined
    duration: StatDuration
    durationNum?: number
    dimension: Exclude<tt4b.core.Dimension, 'run'>
}

export type StatOption = {
    showName: boolean
    topN: number
    donutChart: boolean
}
