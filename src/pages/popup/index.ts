/**
 * Copyright (c) 2021 Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { initLocale } from "@i18n"
import metaService from "@service/meta-service"
import optionService from "@service/option-service"
import { toggle } from "@util/dark-mode"
import "element-plus/theme-chalk/index.css"
import { createApp } from "vue"
import Main from "./Main"
import { type FrameRequest, type FrameResponse } from "./message"
import initRouter from "./router"
import "./style/index.sass"

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
    await initLocale()

    const isDarkMode = await optionService.isDarkMode()
    toggle(isDarkMode)
    await send2ParentWindow('themeInitialized')

    const el = document.createElement('div')
    el.id = 'app'
    document.body.append(el)

    const app = createApp(Main)
    initRouter(app)
    app.mount(el)

    metaService.increasePopup()
}

main()
