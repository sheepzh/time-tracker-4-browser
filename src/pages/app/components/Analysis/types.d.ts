export type AnalysisTarget = {
    type: 'site'
    key: tt4b.site.SiteInfo
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
