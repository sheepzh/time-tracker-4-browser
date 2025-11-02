/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { initLocale } from "@i18n"
import { initElementLocale } from "@i18n/element"
import optionService from "@service/option-service"
import { injectGlobalCss } from '@side/style'
import { init as initTheme, toggle } from "@util/dark-mode"
import { ElLoadingDirective } from 'element-plus'
import 'element-plus/theme-chalk/index.css'
import { type App, createApp } from "vue"
import '../../common/timer'
import Main from "./Layout"

async function main() {
    // Init theme with cache first
    initTheme()
    injectGlobalCss()
    // Calculate the latest mode
    optionService.isDarkMode().then(toggle)
    await initLocale()
    const app: App = createApp(Main)
    await initElementLocale(app)
    app.directive("loading", ElLoadingDirective)

    const el = document.createElement('div')
    document.body.append(el)
    el.id = 'app'
    el.style.height = '100%'
    el.style.overflow = 'hidden'
    app.mount(el)
}

main()
