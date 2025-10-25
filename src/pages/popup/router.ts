import { type App } from "vue"
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router"

export const ROUTE_PERCENTAGE = 'percentage'
const ROUTE_RANKING = 'ranking'

export const POPUP_ROUTES = [ROUTE_PERCENTAGE, ROUTE_RANKING]

export type PopupRoute = typeof POPUP_ROUTES[number]

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/' + ROUTE_PERCENTAGE,
    }, {
        path: '/' + ROUTE_PERCENTAGE,
        component: () => import('./components/Percentage'),
    }, {
        path: '/' + ROUTE_RANKING,
        component: () => import('./components/Ranking'),
    }
]

export default (app: App) => {
    const router = createRouter({
        history: createWebHashHistory(),
        routes,
    })

    app.use(router)
}