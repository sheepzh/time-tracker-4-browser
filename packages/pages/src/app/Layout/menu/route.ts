import { createTabAfterCurrent } from "@api/chrome/tab"
import { type I18nKey, t } from "@app/locale"
import { type Ref } from "vue"
import { type Router } from "vue-router"
import { type MenuItem, menuGroups } from "./item"

function openMenu(route: string, title: I18nKey, router: Router) {
    const currentPath = router.currentRoute.value?.path
    if (currentPath !== route) {
        router?.push(route)
        document.title = t(title)
    }
}

const openHref = (href: string) => createTabAfterCurrent(href)

export function handleClick(menuItem: MenuItem, router: Router, currentActive?: Ref<string | undefined>) {
    const { route, title, href } = menuItem
    if (route) {
        openMenu(route, title, router)
    } else if (href) {
        openHref(href)
        currentActive && (currentActive.value = router.currentRoute?.value?.path)
    }
}

export async function initTitle(router: Router) {
    await router.isReady()
    const currentPath = router.currentRoute.value.path
    for (const group of menuGroups()) {
        for (const { route, title } of group.children) {
            const docTitle = route === currentPath && t(title)
            if (docTitle) {
                document.title = docTitle
                return
            }
        }
    }
}