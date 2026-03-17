/**
 * Meta domain: request to sw. Variable requestMeta for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

const requestMeta = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`meta.${code}` as timer.mq.ReqCode, data)

export function saveFlag(flag: timer.ExtensionMetaFlag) {
    return requestMeta<timer.ExtensionMetaFlag, void>('saveFlag', flag)
}

export function getCid() {
    return requestMeta<void, string | undefined>('getCid')
}

export function increaseApp(routePath: string) {
    return requestMeta<string, void>('increaseApp', routePath)
}

export function increasePopup() {
    return requestMeta<void, void>('increasePopup')
}

export function recommendRate() {
    return requestMeta<void, boolean>('recommendRate')
}
