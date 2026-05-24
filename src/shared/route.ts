export const APP_LIMIT_ROUTE = '/behavior/limit'
export type AppLimitQuery = {
    action?: 'create' | 'modify'
    url?: string
    id?: string
}

export const APP_ANALYSIS_ROUTE = '/data/analysis'
export type AppAnalysisQuery = Partial<tt4b.site.SiteKey> & {
    cateId?: string
    url?: string
}

export const APP_OPTION_ROUTE = '/additional/option'
export const APP_RECORD_ROUTE = '/data/record'
/**
 * The query param of record page
 */
export type AppRecordQuery = {
    /**
     * Query
     */
    q?: string
    /**
     * Merge method
     */
    mm?: Exclude<tt4b.stat.MergeMethod, 'date'>
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
    sc?: tt4b.core.Dimension
}