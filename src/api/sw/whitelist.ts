import { sendMsg2Runtime } from "./common"

export function listWhitelist() {
    return sendMsg2Runtime('whitelist.all')
}

export function addWhitelist(white: string) {
    return sendMsg2Runtime('whitelist.add', white)
}

export function removeWhitelist(white: string) {
    return sendMsg2Runtime('whitelist.remove', white)
}
