/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

type Handler<Code extends tt4b.tab.ReqCode> = (data: tt4b.tab.ReqData<Code>) => tt4b.tab.ResData<Code>

class Dispatcher {
    #handlers = new Map<tt4b.tab.ReqCode, Handler<tt4b.tab.ReqCode>[]>()

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
    }

    register<Code extends tt4b.tab.ReqCode>(code: Code, handler: Handler<Code>): Dispatcher {
        const handlers = this.#handlers.get(code) ?? []
        this.#handlers.set(code, handlers)
        !handlers.includes(handler) && handlers.push(handler)
        return this
    }

    private async handle(message: tt4b.tab.Request<tt4b.tab.ReqCode>): Promise<tt4b.tab.Response<tt4b.tab.ReqCode>> {
        const code = message?.code
        if (!code) {
            return { code: 'ignore' }
        }
        const handlers = this.#handlers.get(code)
        if (!handlers?.length) return { code: 'ignore' }
        try {
            const results = handlers.map(h => h(message.data))
            return { code: "success", data: results[0] }
        } catch (error) {
            const msg = error instanceof Error ? error.message : (error?.toString?.() ?? 'Unknown error')
            return { code: 'fail', msg }
        }
    }
}

export default Dispatcher
