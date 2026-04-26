/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { getOption } from "@api/sw/option"
import { initLocale } from "@i18n"
import { processDarkMode } from '@pages/util/dark-mode'
import { initEcharts } from "@pages/util/echarts"
import type { FrameRequest, FrameResponse } from "@popup/types"
import { createApp } from "vue"
import Main from "./Main"
import initRouter from "./router"
import { injectGlobalCss } from "./style"

function send2ParentWindow(data: any): Promise<void> {
    return new Promise(resolve => {
        try {
            const stamp = Date.now()
            window.onmessage = (ev: MessageEvent) => {
                const resStamp = (ev.data as FrameResponse)?.stamp
                resStamp === stamp && resolve()
            }
            const req: FrameRequest = { stamp, data }
            window.parent.postMessage(req)

            setTimeout(resolve, 1000)
        } catch (e) {
            console.error("Failed to connect the parent window", e)
            resolve()
        }
    })
}

async function main() {
    initLocale()
    initEcharts()
    injectGlobalCss()

    getOption().then(processDarkMode)
    await send2ParentWindow('themeInitialized')

    const el = document.createElement('div')
    el.id = 'app'
    document.body.append(el)

    const app = createApp(Main)
    initRouter(app)
    app.mount(el)
}

main()
