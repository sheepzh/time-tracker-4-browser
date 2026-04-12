export type AnalysisTarget = {
    type: 'site'
    key: timer.site.SiteInfo
} | {
    type: 'cate'
    key: number
}

export type DimensionEntry = {
    date: string
    value: number
}

export type DimensionData = {
    thisPeriod: DimensionEntry[]
    previousPeriod: DimensionEntry[]
}
