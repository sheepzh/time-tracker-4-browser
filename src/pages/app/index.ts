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
import "element-plus/theme-chalk/display.css"
import 'element-plus/theme-chalk/index.css'
import { createApp, type App } from "vue"
import '../../common/timer'
import "../element-ui/dark-theme.css"
import { initEcharts } from "./echarts"
import Main from "./Layout"
import installRouter from "./router"
import "./styles/echarts.css"
import './styles/element.css'
import './styles/index.css'

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
    el.style.height = '100%'
    app.mount(el)

    await initElementLocale(app)
}

main()