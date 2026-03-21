export type AnalysisTarget = {
    type: 'site'
    key: timer.site.SiteInfo
} | {
    type: 'cate'
    key: number
}