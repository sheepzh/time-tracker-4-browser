/**
 * Whitelist domain: request to sw. Variable requestWhitelist for tree-shaking.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

const requestWhitelist = <T, R>(code: string, data?: T) =>
    sendMsg2Runtime<T, R>(`whitelist.${code}` as timer.mq.ReqCode, data)

export function listWhitelist() {
    return requestWhitelist<void, string[]>('listAll')
}

export function addWhitelist(white: string) {
    return requestWhitelist<string, void>('add', white)
}

export function removeWhitelist(white: string) {
    return requestWhitelist<string, void>('remove', white)
}
