/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type App } from "vue"
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router"
import {
    ABOUT_ROUTE, DASHBOARD_ROUTE, FOCUS_ROUTE, HABIT_ANALYSIS_ROUTE, HELP_ROUTE, LIMIT_ROUTE, MIGRATION_ROUTE,
    OPTION_ROUTE, RECORD_ROUTE, SITE_ANALYSIS_ROUTE, SITE_ROUTE,
} from "./constants"

const trackingRoutes: RouteRecordRaw[] = [
    {
        path: '/tracking',
        redirect: DASHBOARD_ROUTE,
    }, {
        path: DASHBOARD_ROUTE,
        component: () => import('../components/Dashboard'),
    }, {
        path: RECORD_ROUTE,
        component: () => import('../components/Record'),
    }, {
        path: SITE_ROUTE,
        component: () => import('../components/SiteManage'),
    }, {
        path: SITE_ANALYSIS_ROUTE,
        component: () => import('../components/Analysis'),
    }
]

const analysisRoutes: RouteRecordRaw[] = [
    {
        path: '/analysis', redirect: SITE_ANALYSIS_ROUTE,
    }, {
        path: SITE_ANALYSIS_ROUTE,
        component: () => import('../components/Analysis'),
    }, {
        path: HABIT_ANALYSIS_ROUTE,
        component: () => import('../components/Habit'),
    },
]

const productivityRoutes: RouteRecordRaw[] = [
    {
        path: '/productivity',
        redirect: LIMIT_ROUTE
    }, {
        path: LIMIT_ROUTE,
        component: () => import('../components/Limit'),
        meta: { noData: true },
    }, {
        path: FOCUS_ROUTE,
        component: () => import('../components/Focus'),
        meta: { noData: true },
    }
]

const otherRoutes: RouteRecordRaw[] = [
    {
        path: '/other',
        redirect: '/other/option'
    }, {
        path: OPTION_ROUTE,
        component: () => import('../components/Option'),
        meta: { noData: true },
    }, {
        path: MIGRATION_ROUTE,
        component: () => import('../components/Migration'),
        meta: { noData: true },
    }, {
        path: HELP_ROUTE,
        component: () => import('../components/HelpUs'),
        meta: { noData: true },
    }, {
        path: ABOUT_ROUTE,
        component: () => import('../components/About'),
        meta: { noData: true },
    },
]

const routes: RouteRecordRaw[] = [
    { path: '/', redirect: DASHBOARD_ROUTE },
    ...trackingRoutes,
    ...analysisRoutes,
    ...productivityRoutes,
    ...otherRoutes,
    { path: '/:W+', redirect: DASHBOARD_ROUTE },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default (app: App) => app.use(router)
