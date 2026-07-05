/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

export {
    APP_FOCUS_ROUTE as FOCUS_ROUTE, APP_LIMIT_ROUTE as LIMIT_ROUTE, APP_OPTION_ROUTE as OPTION_ROUTE,
    APP_RECORD_ROUTE as RECORD_ROUTE, APP_SITE_ANALYSIS_ROUTE as SITE_ANALYSIS_ROUTE, APP_SITE_ROUTE as SITE_ROUTE,
    type AppFocusQuery as FocusQuery, type AppLimitQuery as LimitQuery, type AppRecordQuery as RecordQuery,
    type AppSiteAnalysisQuery as SiteAnalysisQuery
} from "@/shared/route"

export const DASHBOARD_ROUTE = '/tracking/dashboard'
export const RULE_ROUTE = '/tracking/rule'

export const HABIT_ANALYSIS_ROUTE = '/analysis/habit'

export const MIGRATION_ROUTE = '/other/migration'
export const ABOUT_ROUTE = '/other/about'
export const HELP_ROUTE = '/other/help'