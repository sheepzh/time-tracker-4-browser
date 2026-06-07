import { type App } from "vue"
import { createRouter, createWebHashHistory, type RouteRecordRedirect, type RouteRecordSingleView } from "vue-router"

type Path = `/${tt4b.ui.PopupMenu}`
type MyRoute =
    | (Omit<RouteRecordSingleView, 'path'> & { path: Path })
    | (Omit<RouteRecordRedirect, 'redirect'> & { redirect: Path })

const createRoutes = (): MyRoute[] => [
    {
        path: '/',
        redirect: '/percentage',
    }, {
        path: '/percentage',
        component: () => import('./components/Percentage'),
    }, {
        path: '/ranking',
        component: () => import('./components/Ranking'),
    }, {
        path: '/limit',
        component: () => import('./components/Limit'),
    }, {
        path: '/focus',
        component: () => import('./components/Focus'),
    }
]

export default (app: App) => {
    const routes = createRoutes()
    const history = createWebHashHistory()
    const router = createRouter({ routes, history })
    app.use(router)
}