/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

export const DASHBOARD_ROUTE = '/data/dashboard'

export const ANALYSIS_ROUTE = '/data/analysis'

/**
 * @since 0.2.2
 */
export {
    APP_LIMIT_ROUTE as LIMIT_ROUTE, APP_OPTION_ROUTE as OPTION_ROUTE,
    APP_REPORT_ROUTE as REPORT_ROUTE,
    type AppLimitQuery as LimitQuery, type AppReportQuery as ReportQuery
} from "@/shared/route"

/**
 * @since 1.8.0
 */
export const MERGE_ROUTE = '/additional/rule-merge'
