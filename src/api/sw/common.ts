import { handleError } from '../chrome/common'

/**
 * Fix proxy data failed to serialized in Firefox
 */
function cloneData<T = any>(data: T | undefined): T | undefined {
    if (data === undefined) return undefined
    try {
        return JSON.parse(JSON.stringify(data))
    } catch (cloneError) {
        console.warn("Failed clone data", cloneError)
        return data
    }
}

type RuntimeMsgArgs<C extends tt4b.mq.ReqCode> = [tt4b.mq.ReqData<C>] extends [undefined]
    ? [data?: tt4b.mq.ReqData<C>, timeout_ms?: number]
    : [data: tt4b.mq.ReqData<C>, timeout_ms?: number]

export function sendMsg2Runtime<C extends tt4b.mq.ReqCode>(
    code: C,
    ...args: RuntimeMsgArgs<C>
): Promise<tt4b.mq.ResData<C>> {
    const [data, timeout_ms] = args
    const request: tt4b.mq.Request<C> = { code, data: cloneData(data) as tt4b.mq.ReqData<C> }
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            // timeout: no response from runtime
            reject('sendMsg2Runtime timeout')
        }, timeout_ms ?? 10_000)
        try {
            chrome.runtime.sendMessage(request, (response: tt4b.mq.Response<C>) => {
                clearTimeout(timeout)
                handleError('sendMsg2Runtime')
                const resCode = response?.code
                if (resCode === 'fail') {
                    console.warn("Error occurred when querying service-worker", code, data, response?.msg)
                    return reject(new Error(response?.msg || 'Unknown error'))
                }
                resCode === 'success' && resolve(response.data as tt4b.mq.ResData<C>)
            })
        } catch (e) {
            clearTimeout(timeout)
            const msg = e instanceof Error ? e.message : 'Unknown error'
            reject(`Failed to send message: ${msg}`)
        }
    })
}

/**
 * Wrap for hooks, after the extension reloaded or upgraded, the context of current content script will be invalid
 * And sending messages to the runtime will be failed
 */
export async function trySendMsg2Runtime<C extends tt4b.mq.ReqCode>(
    code: C,
    ...args: RuntimeMsgArgs<C>
): Promise<tt4b.mq.ResData<C> | undefined> {
    try {
        return await sendMsg2Runtime(code, ...args)
    } catch {
        return undefined
    }
}
