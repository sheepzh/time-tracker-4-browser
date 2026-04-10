/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */
import { getOption } from "@api/sw/option"
import { initLocale } from "@i18n"
import { createElApp } from "@pages/element-ui/app"
import { init as initTheme, processDarkMode } from "@util/dark-mode"
import Main from "./Layout"
import { injectGlobalCss } from './style'

async function main() {
    // Init theme with cache first
    initTheme()
    injectGlobalCss()
    // Calculate the latest mode
    getOption().then(processDarkMode)
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
