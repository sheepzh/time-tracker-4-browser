import { PopupMessage } from '@i18n/message/popup'
import { type App } from "vue"
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router"

export const ROUTE_PERCENTAGE = 'percentage'
const ROUTE_RANKING = 'ranking'

type PopupRoute = keyof PopupMessage['footer']['route']

export const POPUP_ROUTES: PopupRoute[] = [ROUTE_PERCENTAGE, ROUTE_RANKING]

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