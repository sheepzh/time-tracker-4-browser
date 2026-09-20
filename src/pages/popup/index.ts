/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getOption } from "@api/sw/option"
import { initLocale } from "@i18n"
import { createElApp } from '@pages/element-ui/app'
import { processDarkMode } from '@pages/util/dark-mode'
import { initEcharts } from "@pages/util/echarts"
import { isResponse, type FrameRequest } from "@popup/types"
import Main from "./Main"
import initRouter from "./router"
import { injectGlobalCss } from "./style"

function send2ParentWindow(data: any): Promise<void> {
    return new Promise(resolve => {
        try {
            const stamp = Date.now()
            window.onmessage = ({ data }) => isResponse(data) && data.stamp === stamp && resolve()
            window.parent.postMessage({ stamp, data } satisfies FrameRequest)
            setTimeout(resolve, 1000)
        } catch (e) {
            console.error("Failed to connect the parent window", e)
            resolve()
        }
    })
}

async function main() {
    const option = await getOption()
    processDarkMode(option)
    initLocale(option)
    initEcharts()
    injectGlobalCss()

    await send2ParentWindow('themeInitialized')

    const el = document.createElement('div')
    el.id = 'app'
    document.body.append(el)

    const app = await createElApp(Main)
    initRouter(app)
    app.mount(el)
}

main()
