/**
 * Copyright (c) 2022-present Hengyang Zhang
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

import { onRuntimeMessage } from "@api/chrome/runtime"

class MessageDispatcher {
    private handlers: Partial<{
        [code in timer.mq.ReqCode]: timer.mq.Handler<any, any>
    }> = {}

    register<Req = any, Res = any>(code: timer.mq.ReqCode, handler: timer.mq.Handler<Req, Res>): MessageDispatcher {
        if (this.handlers[code]) {
            throw new Error("Duplicate handler")
        }
        this.handlers[code] = handler
        return this
    }

    private async handle(message: timer.mq.Request<unknown>, sender: ChromeMessageSender): Promise<timer.mq.Response<unknown>> {
        const code = message?.code
        if (!code) {
            return { code: 'ignore' }
        }
        const handler = this.handlers[code]
        if (!handler) {
            return { code: 'ignore' }
        }
        try {
            const result = await handler(message.data, sender)
            return { code: 'success', data: result }
        } catch (error) {
            const msg = error instanceof Error ? error.message : error?.toString?.()
            return { code: 'fail', msg }
        }
    }

    start() {
        onRuntimeMessage((msg, sender) => this.handle(msg, sender))
    }
}

export default MessageDispatcher