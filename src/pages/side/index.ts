/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { initDarkTheme } from "@/pages/util/dark-mode"
import { initLocale } from "@i18n"
import { createElApp } from "@pages/element-ui/app"
import Main from "./Layout"
import { injectGlobalCss } from './style'

async function main() {
    initDarkTheme()
    injectGlobalCss()
    await initLocale()
    const app = await createElApp(Main)

    const el = document.createElement('div')
    document.body.append(el)
    el.id = 'app'
    el.style.height = '100%'
    el.style.overflow = 'hidden'
    app.mount(el)
}

main()
