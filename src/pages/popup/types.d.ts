export type FrameRequest = {
    stamp: number
    data: any
}

export type FrameResponse = {
    stamp: number
}

export type PopupDuration =
    | "today" | "yesterday" | "thisWeek" | "thisMonth"
    | "lastDays"
    | "allTime"

export type PopupQuery = {
    mergeMethod: Exclude<timer.stat.MergeMethod, 'date'> | undefined
    duration: PopupDuration
    durationNum?: number
    dimension: Exclude<timer.core.Dimension, 'run'>
}

export type PopupOption = {
    showName: boolean
    topN: number
    donutChart: boolean
}