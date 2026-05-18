/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import type { AudibleChangeHandler } from './types'

type Handler<Code extends tt4b.tab.ReqCode> = (data: tt4b.tab.ReqData<Code>) => tt4b.tab.ResData<Code>

class Dispatcher {
    private handlers: Partial<Record<tt4b.tab.ReqCode, Handler<tt4b.tab.ReqCode>>> = {}
    private audibleChangeHandlers: AudibleChangeHandler[] = []

    constructor() {
        // Be careful!!!
        // Can't use await/async in callback parameter
        chrome.runtime.onMessage.addListener((message: tt4b.tab.Request<tt4b.tab.ReqCode>, _, sendResponse: tt4b.tab.Callback<tt4b.tab.ReqCode>) => {
            this.handle(message)
                .then(sendResponse)
                .catch((err: unknown) => {
                    const msg = err instanceof Error ? err.message : String(err)
                    console.error('onTabMessage handler error', err)
                    sendResponse({ code: 'fail', msg })
                })
            // 'return true' will force chrome to wait for the response processed in the above promise.
            // @see https://github.com/mozilla/webextension-polyfill/issues/130
            return true
        })

        this.register('syncAudible', audible => void this.audibleChangeHandlers.forEach(h => h.onAudibleChange(audible)))
    }

    register<Code extends tt4b.tab.ReqCode>(code: Code, handler: Handler<Code>): Dispatcher {
        this.handlers[code] = handler
        return this
    }

    registerAudibleChange(handler: AudibleChangeHandler): Dispatcher {
        this.audibleChangeHandlers.push(handler)
        return this
    }

    private async handle(message: tt4b.tab.Request<tt4b.tab.ReqCode>): Promise<tt4b.tab.Response<tt4b.tab.ReqCode>> {
        const code = message?.code
        if (!code) {
            return { code: 'ignore' }
        }
        const handler = this.handlers[code]
        if (!handler) return { code: 'ignore' }
        try {
            const res = handler(message.data as tt4b.tab.ReqData<tt4b.tab.ReqCode>)
            return { code: "success", data: res as tt4b.tab.ResData<typeof code> }
        } catch (error) {
            const msg = error instanceof Error ? error.message : (error?.toString?.() ?? 'Unknown error')
            return { code: 'fail', msg }
        }
    }
}

export default Dispatcher
