/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type App } from "vue"
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router"
import { ANALYSIS_ROUTE, DASHBOARD_ROUTE, LIMIT_ROUTE, MERGE_ROUTE, OPTION_ROUTE, RECORD_ROUTE } from "./constants"

const dataRoutes: RouteRecordRaw[] = [
    {
        path: '/data',
        redirect: DASHBOARD_ROUTE,
    }, {
        path: DASHBOARD_ROUTE,
        component: () => import('../components/Dashboard')
    }, {
        path: RECORD_ROUTE,
        component: () => import('../components/Record')
    }, {
        path: ANALYSIS_ROUTE,
        component: () => import('../components/Analysis')
    }
]

const behaviorRoutes: RouteRecordRaw[] = [
    {
        path: '/productivity',
        redirect: '/productivity/habit'
    }, {
        path: '/productivity/habit',
        component: () => import('../components/Habit'),
    }, {
        path: LIMIT_ROUTE,
        component: () => import('../components/Limit'),
    }, {
        path: '/productivity/focus',
        component: () => import('../components/Focus'),
    }
]

const additionalRoutes: RouteRecordRaw[] = [
    {
        path: '/site-rule',
        redirect: '/site-rule/whitelist'
    }, {
        path: '/site-rule/sites',
        component: () => import('../components/SiteManage')
    }, {
        path: '/site-rule/whitelist',
        component: () => import('../components/Whitelist')
    }, {
        path: MERGE_ROUTE,
        component: () => import('../components/RuleMerge')
    }
]

const otherRoutes: RouteRecordRaw[] = [
    {
        path: '/other',
        redirect: '/other/option'
    }, {
        path: '/other/migration',
        component: () => import('../components/Migration')
    }, {
        path: OPTION_ROUTE,
        component: () => import('../components/Option')
    }, {
        path: '/other/help',
        component: () => import('../components/HelpUs'),
    }, {
        path: '/other/about',
        component: () => import('../components/About'),
    }
]

const routes: RouteRecordRaw[] = [
    { path: '/', redirect: DASHBOARD_ROUTE },
    ...dataRoutes,
    ...behaviorRoutes,
    ...additionalRoutes,
    ...otherRoutes,
    { path: '/:W+', redirect: DASHBOARD_ROUTE },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

export default (app: App) => app.use(router)
