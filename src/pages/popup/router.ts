import type { App } from "vue"
import { createRouter, createWebHashHistory, type RouteRecordRedirect, type RouteRecordSingleView } from "vue-router"

type Path = `/${tt4b.ui.PopupMenu}`
type MyRoute =
    | (Omit<RouteRecordSingleView, 'path'> & { path: Path })
    | (Omit<RouteRecordSingleView, 'path'> & { path: '/' })
    | (Omit<RouteRecordRedirect, 'redirect'> & { redirect: Path })

const createRoutes = (): MyRoute[] => [
    {
        path: '/percentage',
        component: () => import('./components/Percentage'),
    }, {
        path: '/site',
        component: () => import('./components/Site'),
    }, {
        path: '/ranking',
        component: () => import('./components/Ranking'),
    }, {
        path: '/focus',
        component: () => import('./components/Focus'),
        meta: { noData: true },
    }, {
        // Use to remove warnings of "No match found for location with path '/'"
        path: '/',
        component: { render: () => null },
        meta: { noData: true },
    }
]

export default (app: App) => {
    const routes = createRoutes()
    const history = createWebHashHistory()
    const router = createRouter({ routes, history })
    app.use(router)
}