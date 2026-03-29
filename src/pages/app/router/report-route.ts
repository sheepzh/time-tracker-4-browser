/**
 * @since 0.9.1
 */
export const REPORT_ROUTE = '/data/report'


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