export const APP_LIMIT_ROUTE = '/behavior/limit'
export type AppLimitQuery = {
    url?: string
    action?: 'create'
}

export const APP_ANALYSIS_ROUTE = '/data/analysis'
export type AppAnalysisQuery = Partial<timer.site.SiteKey> & {
    cateId?: string
    url?: string
}

export const APP_OPTION_ROUTE = '/additional/option'
export const APP_REPORT_ROUTE = '/data/report'
/**
 * The query param of report page
 */
export type AppReportQuery = {
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