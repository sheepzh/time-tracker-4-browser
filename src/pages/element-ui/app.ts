import { initElementLocale } from "@i18n/element"
import { ElConfigProvider, ElLoadingDirective } from "element-plus"
import { createApp, h, type App, type Component } from "vue"

export async function createElApp(root: Component): Promise<App> {
    const locale = await initElementLocale()
    const app = createApp({
        render: () => h(ElConfigProvider, { locale }, () => h(root)),
    })
    app.directive("loading", ElLoadingDirective)
    return app
}
