/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { initDarkTheme } from "@/pages/util/dark-mode"
import { listenMediaSizeChange } from "@hooks"
import { initLocale } from "@i18n"
import { createElApp } from "@pages/element-ui/app"
import { initEcharts } from "./echarts"
import Main from "./Layout"
import installRouter from "./router"
import { injectAppCss } from './styles/index'

async function main() {
    injectAppCss()
    initDarkTheme()
    listenMediaSizeChange()
    initLocale()
    initEcharts()
    const app = await createElApp(Main)
    installRouter(app)

    const el = document.createElement('div')
    document.body.append(el)
    el.id = 'app'
    app.mount(el)
}

main()