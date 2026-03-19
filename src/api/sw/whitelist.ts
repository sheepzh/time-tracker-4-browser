/**
 * Whitelist domain: request to sw.
 */
import { sendMsg2Runtime } from "@api/chrome/runtime"

export function listWhitelist() {
    return sendMsg2Runtime('whitelist.listAll')
}

export function addWhitelist(white: string) {
    return sendMsg2Runtime('whitelist.add', white)
}

export function removeWhitelist(white: string) {
    return sendMsg2Runtime('whitelist.remove', white)
}
