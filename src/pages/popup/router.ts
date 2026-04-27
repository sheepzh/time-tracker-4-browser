import { useLocalStorage } from '@hooks'
import { type App } from "vue"
import { createRouter, createWebHashHistory, RouteRecordRedirect, type RouteRecordSingleView } from "vue-router"
import type { PopupMenu } from './types'

type Path = `/${PopupMenu}`
type MyRoute =
    | (Omit<RouteRecordSingleView, 'path'> & { path: Path })
    | (Omit<RouteRecordRedirect, 'redirect'> & { redirect: Path })


const createRoutes = (stored: PopupMenu | undefined): MyRoute[] => [
    {
        path: '/',
        redirect: stored ? `/${stored}` : '/percentage',
    }, {
        path: '/percentage',
        component: () => import('./components/Percentage'),
    }, {
        path: '/ranking',
        component: () => import('./components/Ranking'),
    }, {
        path: '/limit',
        component: () => import('./components/Limit'),
    },
]

export default (app: App) => {
    const [stored] = useLocalStorage<PopupMenu>('popup_menu')
    const routes = createRoutes(stored)
    const history = createWebHashHistory()
    const router = createRouter({ routes, history })
    app.use(router)
}