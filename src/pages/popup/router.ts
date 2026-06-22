import type { App } from "vue"
import { createRouter, createWebHashHistory, type RouteRecordRedirect, type RouteRecordSingleView } from "vue-router"

type Path = `/${tt4b.ui.PopupMenu}`
type MyRoute =
    | (Omit<RouteRecordSingleView, 'path'> & { path: Path })
    | (Omit<RouteRecordSingleView, 'path'> & { path: '/' })
    | (Omit<RouteRecordRedirect, 'redirect'> & { redirect: Path })


// Not to set redirect path for '/', which is managed by menu context
const createRoutes = (): MyRoute[] => [
    {
        path: '/percentage',
        component: () => import('./components/Percentage'),
    }, {
        path: '/ranking',
        component: () => import('./components/Ranking'),
    }, {
        path: '/limit',
        component: () => import('./components/Limit'),
    }, {
        // Use to remove warnings of "No match found for location with path '/'"
        path: '/',
        component: () => import('./components/Percentage'),
    }
]

export default (app: App) => {
    const routes = createRoutes()
    const history = createWebHashHistory()
    const router = createRouter({ routes, history })
    app.use(router)
}