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

export function sendMsg2Runtime<C extends timer.mq.ReqCode>(
    code: C,
    data?: timer.mq.ReqData<C>,
    timeout_ms?: number
): Promise<timer.mq.ResData<C>>

export function sendMsg2Runtime<C extends timer.mq.ReqCode>(
    code: timer.mq.ReqData<C> extends undefined ? C : never,
    data?: timer.mq.ReqData<C>,
    timeout_ms?: number
): Promise<timer.mq.ResData<C>>

export function sendMsg2Runtime<C extends timer.mq.ReqCode>(
    code: C,
    data?: timer.mq.ReqData<C>,
    timeout_ms?: number
): Promise<timer.mq.ResData<C>> {
    const request: timer.mq.Request<C> = { code, data: cloneData(data) as timer.mq.ReqData<C> }
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            // timeout: no response from runtime
            reject('sendMsg2Runtime timeout')
        }, timeout_ms ?? 10_000)
        try {
            chrome.runtime.sendMessage(request, (response: timer.mq.Response<C>) => {
                clearTimeout(timeout)
                handleError('sendMsg2Runtime')
                const resCode = response?.code
                if (resCode === 'fail') {
                    console.warn("Error occurred when querying service-worker", code, data, response?.msg)
                    return reject(new Error(response?.msg || 'Unknown error'))
                }
                resCode === 'success' && resolve(response.data as timer.mq.ResData<C>)
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
export function trySendMsg2Runtime<C extends timer.mq.ReqCode>(
    code: C,
    data: timer.mq.ReqData<C>,
    timeout_ms?: number
): Promise<timer.mq.ResData<C>>

export function trySendMsg2Runtime<C extends timer.mq.ReqCode>(
    code: timer.mq.ReqData<C> extends undefined ? C : never,
    data?: timer.mq.ReqData<C>,
    timeout_ms?: number
): Promise<timer.mq.ResData<C>>

export async function trySendMsg2Runtime<C extends timer.mq.ReqCode>(code: C, data?: timer.mq.ReqData<C>): Promise<timer.mq.ResData<C> | undefined> {
    try {
        return await sendMsg2Runtime(code, data)
    } catch {
        return undefined
    }
}