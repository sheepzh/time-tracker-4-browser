/**
 * Copyright (c) 2021-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { type App } from "vue"
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router"
import { ANALYSIS_ROUTE, DASHBOARD_ROUTE, LIMIT_ROUTE, MERGE_ROUTE, OPTION_ROUTE, REPORT_ROUTE } from "./constants"

const dataRoutes: RouteRecordRaw[] = [
    {
        path: '/data',
        redirect: DASHBOARD_ROUTE,
    },
    // Needn't nested router
    {
        path: DASHBOARD_ROUTE,
        component: () => import('../components/Dashboard')
    },
    {
        path: REPORT_ROUTE,
        component: () => import('../components/Report')
    }, {
        path: ANALYSIS_ROUTE,
        component: () => import('../components/Analysis')
    }, {
        path: '/data/manage',
        component: () => import('../components/DataManage')
    }
]

const behaviorRoutes: RouteRecordRaw[] = [
    {
        path: '/behavior',
        redirect: '/behavior/habit'
    }, {
        path: '/behavior/habit',
        component: () => import('../components/Habit'),
    }, {
        path: LIMIT_ROUTE,
        component: () => import('../components/Limit'),
    }
]

const additionalRoutes: RouteRecordRaw[] = [
    {
        path: '/additional',
        redirect: '/additional/whitelist'
    }, {
        path: '/additional/site-manage',
        component: () => import('../components/SiteManage')
    }, {
        path: '/additional/whitelist',
        component: () => import('../components/Whitelist')
    }, {
        path: MERGE_ROUTE,
        component: () => import('../components/RuleMerge')
    }, {
        path: OPTION_ROUTE,
        component: () => import('../components/Option')
    }
]

const otherRoutes: RouteRecordRaw[] = [
    {
        path: '/other',
        redirect: '/other/help'
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
