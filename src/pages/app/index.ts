/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { listenMediaSizeChange } from "@hooks"
import { initLocale } from "@i18n"
import { initElementLocale } from "@i18n/element"
import optionService from "@service/option-service"
import { init as initTheme, toggle } from "@util/dark-mode"
import 'element-plus/theme-chalk/index.css'
import { createApp, type App } from "vue"
import '../../common/timer'
import { initEcharts } from "./echarts"
import Main from "./Layout"
import installRouter from "./router"
import './styles/index.sass'

async function main() {
    // Init theme with cache first
    initTheme()
    listenMediaSizeChange()
    // Calculate the latest mode
    optionService.isDarkMode().then(toggle)
    await initLocale()
    initEcharts()
    const app: App = createApp(Main)
    installRouter(app)

    const el = document.createElement('div')
    document.body.append(el)
    el.id = 'app'
    app.mount(el)

    await initElementLocale(app)
}

main()